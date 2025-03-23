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

## Application Structure

### Frontend Architecture
The application follows a component-based architecture:
- `App.tsx` - Main application component
- `components/` - Reusable UI components
- `pages/` - Main application views
- `services/` - API integration and data handling
- `types/` - TypeScript type definitions

### Data Flow
1. User browses available datasets on the home page
2. Upon selecting a dataset, user is presented with associated questionnaires
3. For each questionnaire:
   - User can view questionnaire details ("nomFormulaire")
   - Select variables using provided descriptions
   - Save selections for the current questionnaire
4. After completing all selections, user can retrieve the final selection
5. Selected data is formatted as JSON and sent to the API

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
