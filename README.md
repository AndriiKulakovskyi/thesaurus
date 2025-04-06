# Thesaurus - Dataset Variable Selection Tool

## Overview
Thesaurus is a modern web application designed to facilitate the exploration and extraction of variables from multiple datasets. It provides researchers and data analysts with an intuitive interface to browse through various datasets, examine their questionnaires, and select specific variables for extraction.

## Features
- Browse available datasets with detailed descriptions and metadata
- View questionnaires associated with each dataset
- Select variables of interest from each questionnaire
- Save variable selections per questionnaire
- Generate and export final variable selection for data extraction

## Tech Stack
### Frontend
- React 18
- TypeScript
- Vite (for build tooling)
- React Router (for navigation)
- Material-UI (for UI components)
- Axios (for API requests)

### Backend (API Endpoints)
The application interacts with a REST API that provides the following endpoints:
- `GET /api/databases` - Retrieve list of available datasets
- `GET /api/databases/{id}/questionnaires` - Retrieve questionnaires for a specific dataset
- `POST /api/selections` - Save selected variables for data extraction

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/thesaurus.git
cd thesaurus
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Frontend Architecture

### Component Structure
The application follows a component-based architecture organized as follows:

- **App.tsx**: Main application component that sets up routing and global providers
- **components/**: Reusable UI components
  - **DatasetGrid.tsx**: Displays a grid of available datasets with filtering and sorting capabilities
  - **DatasetDetail.tsx**: Shows detailed information about a selected dataset and its questionnaires
  - **QuestionnaireVariables.tsx**: Displays variables from a specific questionnaire with selection functionality
  - **VariableSelectionSummary.tsx**: Summarizes selected variables across questionnaires
  - **UI components**: Shadcn UI components for consistent styling
- **lib/**: API integration and utilities
  - **api.ts**: Re-exports from endpoints.ts for backward compatibility
  - **endpoints.ts**: Contains all API endpoint functions and dummy data handling
  - **constants.ts**: Application constants including API base URL

### Data Flow

1. User browses available datasets on the home page (DatasetGrid)
2. Upon selecting a dataset, user is presented with associated questionnaires (DatasetDetail)
3. For each questionnaire:
   - User can view questionnaire details and variables (QuestionnaireVariables)
   - Select variables using provided descriptions
   - Save selections for the current questionnaire
4. After completing all selections, user can review and finalize the selection (VariableSelectionSummary)
5. Selected data is formatted as JSON and sent to the API

## API Integration

### API Endpoints

The application interacts with the following endpoints:

#### 1. Fetch Databases/Datasets

```typescript
fetchDatabases(): Promise<Database[]>
```

**Endpoint**: `GET /api/v1/studies`

**Response Format**:
```json
[
  {
    "id": "_prod_clean_easperger",
    "title": "Asperger Syndrome Study",
    "description": "Clinical data from patients diagnosed with Asperger syndrome",
    "record_count": 1250,
    "last_updated": "2023-05-15T10:30:00Z",
    "metadata": {
      "study_type": "Longitudinal",
      "year_started": 2018,
      "principal_investigator": "Dr. Jane Smith",
      "patient_count": 1250
    }
  }
]
```

#### 2. Fetch Single Database/Dataset

```typescript
fetchDatabase(datasetId: string): Promise<Database>
```

**Endpoint**: `GET /api/v1/studies` (filtered by ID)

**Response Format**: Same as a single item from the databases list

#### 3. Fetch Questionnaires for a Dataset

```typescript
fetchQuestionnaires(datasetId: string): Promise<any[]>
```

**Endpoint**: `GET /api/v1/studies/${datasetId}/tables`

**Response Format**:
```json
[
  {
    "form": {
      "nomFormulaire": "Patient Demographics",
      "nomTable": "_prod_clean_easperger.demographics"
    },
    "fields": [
      [
        {
          "description": "Patient ID",
          "variable_name": "patient_id",
          "data_type": "string",
          "possible_answers": {}
        },
        {
          "description": "Age at diagnosis",
          "variable_name": "age_at_diagnosis",
          "data_type": "integer",
          "possible_answers": {}
        }
      ]
    ]
  }
]
```

#### 4. Submit Extraction Request

```typescript
submitExtraction(request: ExtractionRequest): Promise<ExtractionResponse>
```

**Endpoint**: `POST /api/v1/extract`

**Request Format**:
```json
{
  "datasetId": "_prod_clean_easperger",
  "selections": [
    {
      "questionnaireId": "demographics",
      "variables": ["patient_id", "age_at_diagnosis", "gender"]
    },
    {
      "questionnaireId": "clinical_assessment",
      "variables": ["assessment_date", "severity_score"]
    }
  ]
}
```

**Response Format**:
```json
{
  "status": "success",
  "message": "Data extraction completed successfully",
  "request": { /* original request object */ },
  "dataset": "_prod_clean_easperger",
  "selections_count": 2,
  "total_variables": 5
}
```

### Data Types

#### Database
```typescript
interface Database {
  id: string;              // Unique identifier for the dataset
  title: string;           // Human-readable title
  description: string;     // Detailed description
  record_count: number;    // Number of records in the dataset
  last_updated: string;    // ISO date string of last update
  metadata?: {            // Optional metadata
    study_type?: string;   // Type of study (e.g., "Longitudinal")
    year_started?: number; // Year the study started
    principal_investigator?: string; // Lead researcher
    patient_count?: number; // Number of patients in the study
    [key: string]: any;    // Additional metadata fields
  };
}
```

#### Variable Selection
```typescript
interface VariableSelection {
  questionnaireId: string; // ID of the questionnaire
  variables: string[];     // Array of variable names to extract
}
```

#### Extraction Request
```typescript
interface ExtractionRequest {
  datasetId: string;                // ID of the dataset
  selections: VariableSelection[];  // Array of selections
}
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Environment Variables
Create a `.env` file in the root directory:
```
VITE_API_BASE_URL=your_api_base_url
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
