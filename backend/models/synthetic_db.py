from typing import Dict, List, Any, Optional, Type
import os
import logging
import yaml
import random
from datetime import datetime, date, timedelta
from sqlalchemy import MetaData

from .base import BaseORMModel, StudyInfoModel, MetadataModel

logger = logging.getLogger(__name__)

class SyntheticDatabaseManager:
    """
    A synthetic database manager that mimics a real database connection
    but serves synthetic data based on the schema structure.
    """
    
    def __init__(self):
        """Initialize the synthetic database manager"""
        self.models: Dict[str, Dict[str, Type[BaseORMModel]]] = {}
        self.study_info: Dict[str, StudyInfoModel] = {}
        self.data_store: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
        self.metadata = MetaData()
        self._load_study_info()
        self._generate_synthetic_data()
    
    def _load_study_info(self):
        """Load study information from YAML config"""
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'databases.yaml')
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                
            # Convert raw config to StudyInfoModel objects
            for schema, info in config.items():
                metadata = MetadataModel(
                    study_type=info.get('metadata', {}).get('study_type', 'Unknown'),
                    year_started=info.get('metadata', {}).get('year_started', 2000),
                    principal_investigator=info.get('metadata', {}).get('principal_investigator', 'Unknown'),
                    patient_count=info.get('metadata', {}).get('patient_count', 100)
                )
                
                self.study_info[schema] = StudyInfoModel(
                    name=info.get('name', schema),
                    description=info.get('description', f"Dataset for {schema}"),
                    metadata=metadata
                )
                
            logger.info(f"Loaded {len(config)} study configurations for synthetic database")
        except Exception as e:
            logger.error(f"Error loading study info for synthetic database: {e}")
    
    def _generate_synthetic_data(self):
        """Generate synthetic data for all schemas defined in the study info"""
        logger.info("Generating synthetic data for all schemas")
        
        for schema_name in self.study_info.keys():
            # Create an empty data store for this schema
            self.data_store[schema_name] = {}
            
            # Generate some common tables for each schema
            self._generate_patients_table(schema_name)
            self._generate_visits_table(schema_name)
            self._generate_questionnaires(schema_name)
            
    def _generate_patients_table(self, schema_name: str):
        """Generate synthetic patient data"""
        table_name = "patients"
        patient_count = 100
        if schema_name in self.study_info:
            study_info = self.study_info[schema_name]
            if hasattr(study_info.metadata, "patient_count"):
                patient_count = study_info.metadata.patient_count
        
        patients = []
        for i in range(1, patient_count + 1):
            patient = {
                "id": i,
                "patient_id": f"P{i:06d}",
                "age": random.randint(18, 85),
                "gender": random.choice(["Male", "Female", "Other"]),
                "enrollment_date": (date.today() - timedelta(days=random.randint(30, 1000))).isoformat(),
                "status": random.choice(["Active", "Completed", "Withdrawn", "Lost to Follow-up"]),
            }
            patients.append(patient)
        
        self.data_store[schema_name][table_name] = patients
        logger.info(f"Generated {len(patients)} synthetic patients for schema {schema_name}")
    
    def _generate_visits_table(self, schema_name: str):
        """Generate synthetic visit data related to patients"""
        table_name = "visits"
        
        if "patients" not in self.data_store[schema_name]:
            logger.warning(f"Cannot generate visits: patient table not found for {schema_name}")
            return
        
        visits = []
        visit_id = 1
        
        for patient in self.data_store[schema_name]["patients"]:
            patient_id = patient["id"]
            enrollment_date = date.fromisoformat(patient["enrollment_date"])
            
            # Generate 1-5 visits per patient
            visit_count = random.randint(1, 5)
            
            for visit_num in range(1, visit_count + 1):
                visit_date = enrollment_date + timedelta(days=visit_num * 90)  # Visits every ~3 months
                
                visit = {
                    "id": visit_id,
                    "visit_id": f"V{visit_id:06d}",
                    "patient_id": patient_id,
                    "visit_number": visit_num,
                    "visit_date": visit_date.isoformat(),
                    "visit_type": random.choice(["Screening", "Baseline", "Follow-up", "Final"]),
                    "completed": random.choice([True, True, True, False]),  # 75% chance of completion
                }
                visits.append(visit)
                visit_id += 1
        
        self.data_store[schema_name][table_name] = visits
        logger.info(f"Generated {len(visits)} synthetic visits for schema {schema_name}")
    
    def _generate_questionnaires(self, schema_name: str):
        """Generate synthetic questionnaire data"""
        # Example questionnaires based on the study type
        study_name = ""
        if schema_name in self.study_info:
            study_name = self.study_info[schema_name].name
        
        if "Asperger" in study_name:
            self._generate_autism_questionnaires(schema_name)
        elif "Bipolar" in study_name:
            self._generate_bipolar_questionnaires(schema_name) 
        elif "Depression" in study_name:
            self._generate_depression_questionnaires(schema_name)
        elif "Schizophrenia" in study_name:
            self._generate_schizophrenia_questionnaires(schema_name)
            
    def _generate_autism_questionnaires(self, schema_name: str):
        """Generate autism-specific questionnaires"""
        self._generate_generic_questionnaire(
            schema_name, 
            "aq", 
            ["social_skill", "attention_switching", "attention_to_detail", "communication", "imagination", "total_score"],
            lambda: {
                "social_skill": random.randint(0, 10),
                "attention_switching": random.randint(0, 10),
                "attention_to_detail": random.randint(0, 10),
                "communication": random.randint(0, 10),
                "imagination": random.randint(0, 10),
                "total_score": random.randint(0, 50)
            }
        )
    
    def _generate_bipolar_questionnaires(self, schema_name: str):
        """Generate bipolar-specific questionnaires"""
        self._generate_generic_questionnaire(
            schema_name, 
            "ymrs", 
            ["elevated_mood", "increased_energy", "sexual_interest", "sleep", "irritability", "speech", "total_score"],
            lambda: {
                "elevated_mood": random.randint(0, 4),
                "increased_energy": random.randint(0, 4),
                "sexual_interest": random.randint(0, 4),
                "sleep": random.randint(0, 4),
                "irritability": random.randint(0, 8),
                "speech": random.randint(0, 8),
                "total_score": random.randint(0, 60)
            }
        )
    
    def _generate_depression_questionnaires(self, schema_name: str):
        """Generate depression-specific questionnaires"""
        self._generate_generic_questionnaire(
            schema_name, 
            "phq9", 
            ["interest", "feeling_down", "sleep", "energy", "appetite", "feeling_bad", "concentration", "movement", "thoughts", "total_score"],
            lambda: {
                "interest": random.randint(0, 3),
                "feeling_down": random.randint(0, 3),
                "sleep": random.randint(0, 3),
                "energy": random.randint(0, 3),
                "appetite": random.randint(0, 3),
                "feeling_bad": random.randint(0, 3),
                "concentration": random.randint(0, 3),
                "movement": random.randint(0, 3),
                "thoughts": random.randint(0, 3),
                "total_score": random.randint(0, 27)
            }
        )
    
    def _generate_schizophrenia_questionnaires(self, schema_name: str):
        """Generate schizophrenia-specific questionnaires"""
        self._generate_generic_questionnaire(
            schema_name, 
            "panss", 
            ["positive_scale", "negative_scale", "general_psychopathology", "total_score"],
            lambda: {
                "positive_scale": random.randint(7, 49),
                "negative_scale": random.randint(7, 49),
                "general_psychopathology": random.randint(16, 112),
                "total_score": random.randint(30, 210)
            }
        )
    
    def _generate_generic_questionnaire(self, schema_name: str, table_name: str, fields: List[str], value_generator):
        """Generic method to generate questionnaire data with specified structure"""
        if "patients" not in self.data_store[schema_name] or "visits" not in self.data_store[schema_name]:
            logger.warning(f"Cannot generate {table_name}: required tables not found for {schema_name}")
            return
        
        records = []
        record_id = 1
        
        for visit in self.data_store[schema_name]["visits"]:
            # 80% chance of having this questionnaire for a visit
            if random.random() < 0.8:
                # Get base data from generator function
                record_data = value_generator()
                
                # Add record metadata
                record_data["id"] = record_id
                record_data["patient_id"] = visit["patient_id"]
                record_data["visit_id"] = visit["id"]
                record_data["completed_date"] = visit["visit_date"]
                
                records.append(record_data)
                record_id += 1
        
        self.data_store[schema_name][table_name] = records
        logger.info(f"Generated {len(records)} synthetic {table_name} records for schema {schema_name}")
    
    # Methods that match the interface of the real DatabaseManager
    
    def get_schema_models(self, schema_name: str):
        """Get models for a schema - for compatibility with real DB manager"""
        # For synthetic DB, we just return field names based on the generated data
        result = {}
        
        if schema_name in self.data_store:
            for table_name, records in self.data_store[schema_name].items():
                if records:  # Make sure there's at least one record
                    # Get field names from first record
                    fields = list(records[0].keys())
                    # Create a mock model object with model_fields
                    model = type(f"{schema_name}_{table_name}_Model", (), {
                        "model_fields": {field: None for field in fields},
                        "__doc__": f"Synthetic model for {schema_name}.{table_name}"
                    })
                    result[f"{schema_name}.{table_name}"] = model
        
        return result
    
    def get_study_info(self, schema_name: str):
        """Get study information for a schema"""
        return self.study_info.get(schema_name)
    
    def get_table_columns(self, schema_name: str, table_name: str) -> List[str]:
        """Get column names for a specific table"""
        if schema_name in self.data_store and table_name in self.data_store[schema_name]:
            if self.data_store[schema_name][table_name]:
                return list(self.data_store[schema_name][table_name][0].keys())
        return []
    
    def extract_data(self, schema_name: str, table_name: str, columns: List[str], filters: Optional[Dict] = None):
        """Extract data from a table with specified columns"""
        if schema_name in self.data_store and table_name in self.data_store[schema_name]:
            data = self.data_store[schema_name][table_name]
            
            # Apply filters if provided
            if filters:
                filtered_data = []
                for record in data:
                    match = True
                    for column, value in filters.items():
                        if column in record and record[column] != value:
                            match = False
                            break
                    if match:
                        filtered_data.append(record)
                data = filtered_data
            
            # Select only requested columns
            result = []
            for record in data:
                filtered_record = {col: record.get(col) for col in columns if col in record}
                result.append(filtered_record)
            
            return result
        
        return [] 