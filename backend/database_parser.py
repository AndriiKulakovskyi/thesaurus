import sys
import logging
import os
import json
import yaml
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, inspect, text
from sqlalchemy.exc import SQLAlchemyError

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Load environment variables
load_dotenv()

class DatabaseInspector:
    """
    A class to connect to a PostgreSQL database, introspect its schema, 
    and provide methods to analyze tables and relationships.
    """
    def __init__(self):
        """
        Initialize the DatabaseInspector with connection details from environment variables.
        """
        self.connection_string = os.getenv('DATABASE_URL')
        if not self.connection_string:
            raise ValueError("DATABASE_URL environment variable is not set")
        
        self.engine = None
        self.metadata = MetaData()
        self.inspector = None
        self.schemas = []
        self.analysis_results = None

    def connect(self):
        """
        Establishes a connection to the PostgreSQL database.
        """
        try:
            self.engine = create_engine(self.connection_string)
            self.inspector = inspect(self.engine)
            with self.engine.connect() as connection:
                logging.info("Successfully connected to the database.")
        except SQLAlchemyError as e:
            logging.error("Error connecting to the database: %s", e)
            sys.exit(1)

    def get_schemas(self):
        """
        Retrieves all available schemas from the database.
        """
        try:
            with self.engine.connect() as connection:
                query = text("""
                    SELECT schema_name 
                    FROM information_schema.schemata 
                    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
                    ORDER BY schema_name;
                """)
                result = connection.execute(query)
                self.schemas = [row[0] for row in result]
                logging.info(f"Found {len(self.schemas)} schemas: {', '.join(self.schemas)}")
                return self.schemas
        except SQLAlchemyError as e:
            logging.error(f"Error retrieving schemas: {e}")
            return []

    def analyze_database(self):
        """
        Performs comprehensive analysis of the database structure.
        """
        if self.engine is None:
            raise ValueError("Engine not connected. Call connect() first.")

        if not self.schemas:
            self.get_schemas()

        analysis = {
            'timestamp': datetime.now().isoformat(),
            'database_url': self.connection_string,
            'schemas': {},
            'relationships': [],
            'summary': {
                'total_schemas': len(self.schemas),
                'total_tables': 0,
                'total_columns': 0,
                'total_relationships': 0
            }
        }

        # Analyze each schema
        for schema in self.schemas:
            try:
                # Reflect tables for current schema
                self.metadata.reflect(bind=self.engine, schema=schema)
                
                # Get tables for current schema
                schema_tables = {name: table for name, table in self.metadata.tables.items() 
                               if name.startswith(f"{schema}.")}
                
                analysis['schemas'][schema] = {
                    'tables': {},
                    'total_tables': len(schema_tables),
                    'total_columns': 0
                }

                # Analyze each table in the schema
                for table_name, table in schema_tables.items():
                    table_info = {
                        'name': table_name.split('.')[-1],
                        'columns': [],
                        'primary_keys': [],
                        'foreign_keys': [],
                        'indexes': []
                    }

                    # Analyze columns
                    for col in table.columns:
                        column_info = {
                            'name': col.name,
                            'type': str(col.type),
                            'nullable': col.nullable,
                            'primary_key': col.primary_key,
                            'default': str(col.default) if col.default else None
                        }
                        table_info['columns'].append(column_info)
                        analysis['schemas'][schema]['total_columns'] += 1
                        analysis['summary']['total_columns'] += 1

                    # Analyze primary keys
                    table_info['primary_keys'] = [pk.name for pk in table.primary_key]

                    # Analyze foreign keys
                    for fk in table.foreign_keys:
                        fk_info = {
                            'column': fk.parent.name,
                            'references_table': f"{fk.column.table.schema}.{fk.column.table.name}",
                            'references_column': fk.column.name
                        }
                        table_info['foreign_keys'].append(fk_info)
                        
                        # Add relationship to the relationships list
                        analysis['relationships'].append({
                            'from_schema': schema,
                            'from_table': table_name.split('.')[-1],
                            'from_column': fk.parent.name,
                            'to_schema': fk.column.table.schema,
                            'to_table': fk.column.table.name,
                            'to_column': fk.column.name
                        })
                        analysis['summary']['total_relationships'] += 1

                    # Analyze indexes
                    for index in table.indexes:
                        table_info['indexes'].append({
                            'name': index.name,
                            'columns': [col.name for col in index.columns]
                        })

                    analysis['schemas'][schema]['tables'][table_name] = table_info
                    analysis['summary']['total_tables'] += 1

            except SQLAlchemyError as e:
                logging.warning(f"Error analyzing schema {schema}: {e}")
                continue

        self.analysis_results = analysis
        return analysis

    def generate_report(self, base_output_dir: str = 'data'):
        """
        Generates a comprehensive report of the database analysis, organized by schema.
        """
        if not self.analysis_results:
            logging.error("No analysis results available. Run analyze_database() first.")
            return False

        # Create base output directory if it doesn't exist
        os.makedirs(base_output_dir, exist_ok=True)

        # Generate timestamp for filenames
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        try:
            # Generate overall summary report
            summary_filepath = os.path.join(base_output_dir, f"database_summary_{timestamp}.txt")
            with open(summary_filepath, 'w') as f:
                f.write("=== Database Analysis Summary ===\n\n")
                f.write("Summary:\n")
                f.write(f"Total Schemas: {self.analysis_results['summary']['total_schemas']}\n")
                f.write(f"Total Tables: {self.analysis_results['summary']['total_tables']}\n")
                f.write(f"Total Columns: {self.analysis_results['summary']['total_columns']}\n")
                f.write(f"Total Relationships: {self.analysis_results['summary']['total_relationships']}\n\n")

                f.write("=== Schema Overview ===\n")
                for schema, schema_info in self.analysis_results['schemas'].items():
                    if schema != 'public':  # Skip public schema in summary
                        f.write(f"\nSchema: {schema}\n")
                        f.write(f"Total Tables: {schema_info['total_tables']}\n")
                        f.write(f"Total Columns: {schema_info['total_columns']}\n")
            logging.info(f"Summary report generated: {summary_filepath}")

            # Generate schema-specific reports
            for schema, schema_info in self.analysis_results['schemas'].items():
                if schema == 'public':  # Skip public schema
                    continue
                    
                # Create schema-specific directory
                schema_dir = os.path.join(base_output_dir, schema)
                os.makedirs(schema_dir, exist_ok=True)

                # Generate YAML report for schema
                yaml_filepath = os.path.join(schema_dir, f"{schema}_analysis_{timestamp}.yaml")
                with open(yaml_filepath, 'w') as f:
                    yaml.dump(schema_info, f, default_flow_style=False, sort_keys=False)
                logging.info(f"YAML report generated for schema {schema}: {yaml_filepath}")

                # Generate JSON report for schema
                json_filepath = os.path.join(schema_dir, f"{schema}_analysis_{timestamp}.json")
                with open(json_filepath, 'w') as f:
                    json.dump(schema_info, f, indent=2, sort_keys=False)
                logging.info(f"JSON report generated for schema {schema}: {json_filepath}")

                # Generate text report for schema
                txt_filepath = os.path.join(schema_dir, f"{schema}_analysis_{timestamp}.txt")
                with open(txt_filepath, 'w') as f:
                    f.write(f"=== Schema Analysis: {schema} ===\n\n")
                    f.write(f"Total Tables: {schema_info['total_tables']}\n")
                    f.write(f"Total Columns: {schema_info['total_columns']}\n\n")

                    for table_name, table_info in schema_info['tables'].items():
                        f.write(f"\nTable: {table_info['name']}\n")
                        f.write("Columns:\n")
                        for col in table_info['columns']:
                            f.write(f"  - {col['name']} ({col['type']})\n")
                            f.write(f"    Nullable: {col['nullable']}\n")
                            if col['default']:
                                f.write(f"    Default: {col['default']}\n")
                        
                        if table_info['primary_keys']:
                            f.write(f"\nPrimary Keys: {', '.join(table_info['primary_keys'])}\n")
                        
                        if table_info['foreign_keys']:
                            f.write("\nForeign Keys:\n")
                            for fk in table_info['foreign_keys']:
                                f.write(f"  - {fk['column']} -> {fk['references_table']}.{fk['references_column']}\n")
                        
                        if table_info['indexes']:
                            f.write("\nIndexes:\n")
                            for idx in table_info['indexes']:
                                f.write(f"  - {idx['name']} on columns: {', '.join(idx['columns'])}\n")
                        f.write("\n")
                logging.info(f"Text report generated for schema {schema}: {txt_filepath}")

                # Generate schema-specific relationships report
                rel_filepath = os.path.join(schema_dir, f"{schema}_relationships_{timestamp}.txt")
                with open(rel_filepath, 'w') as f:
                    f.write(f"=== Relationships for Schema: {schema} ===\n\n")
                    schema_relationships = [rel for rel in self.analysis_results['relationships'] 
                                         if rel['from_schema'] == schema]
                    
                    if schema_relationships:
                        for rel in schema_relationships:
                            f.write(f"{rel['from_table']}.{rel['from_column']} -> ")
                            f.write(f"{rel['to_schema']}.{rel['to_table']}.{rel['to_column']}\n")
                    else:
                        f.write("No relationships found in this schema.\n")
                logging.info(f"Relationships report generated for schema {schema}: {rel_filepath}")

            return True

        except Exception as e:
            logging.error(f"Error generating reports: {e}")
            return False

def main():
    try:
        # Create an instance of DatabaseInspector and connect to the database
        inspector = DatabaseInspector()
        inspector.connect()

        # Perform comprehensive database analysis
        logging.info("Starting database analysis...")
        analysis = inspector.analyze_database()
        logging.info("Database analysis completed.")

        # Generate reports
        logging.info("Generating reports...")
        if inspector.generate_report():
            logging.info("Reports generated successfully.")
        else:
            logging.error("Failed to generate reports.")

    except Exception as e:
        logging.error("An error occurred: %s", e)
        sys.exit(1)


if __name__ == '__main__':
    main()
