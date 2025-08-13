# 🔮 Data Alchemist - AI Resource Allocation Configurator

Transform your messy spreadsheets into clean, validated data with AI-powered validation, business rules, and intelligent resource allocation configuration.

## 🚀 Features

### **Milestone 1: Data Ingestion & Validation** ✅
- **Smart Data Ingestion**: Upload CSV/XLSX files for clients, workers, and tasks
- **Comprehensive Validation**: 12+ validation rules including cross-reference checks
- **Inline Data Editing**: Fix errors directly in interactive data grids
- **Real-time Validation**: Immediate feedback on data changes
- **Sample Data**: Pre-built sample files for testing

### **Milestone 2: Business Rules & Prioritization** ✅
- **Complete Rule System**: 6 rule types (co-run, slot-restriction, load-limit, phase-window, pattern-match, precedence-override)
- **AI-Powered Rule Creation**: Natural language to rule conversion
- **Advanced Prioritization**: Multiple methods (sliders, drag-and-drop, pairwise comparison, presets)
- **Rule Management**: Create, edit, and prioritize business rules

### **Milestone 3: AI Features** 🚧
- **Natural Language Processing**: AI-powered rule suggestions and data analysis
- **Intelligent Validation**: AI engine for broader validation rules
- **Smart Data Correction**: AI-powered error fixing suggestions

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **Data Management**: React Context with TypeScript
- **Validation**: Zod schemas with custom validation engine
- **File Processing**: Papa Parse (CSV) + XLSX (Excel)
- **AI Integration**: OpenAI API ready (currently mocked)

## 📁 Project Structure

```
data-alchemist/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── upload/         # Data upload interface
│   │   ├── clients/        # Client data management
│   │   ├── workers/        # Worker data management
│   │   ├── tasks/          # Task data management
│   │   ├── rules/          # Business rules engine
│   │   ├── priorities/     # Prioritization system
│   │   └── export/         # Data export system
│   ├── components/         # Reusable UI components
│   ├── lib/               # Core logic and utilities
│   ├── types/             # TypeScript type definitions
│   └── samples/           # Sample data files
├── public/                # Static assets
└── package.json          # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd data-alchemist

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. **Upload Data**: Visit `/upload` to upload your CSV/XLSX files
2. **Review & Edit**: Use the data grids to view and fix validation errors
3. **Create Rules**: Visit `/rules` to define business rules
4. **Set Priorities**: Visit `/priorities` to configure allocation criteria
5. **Export**: Download clean data and configuration files

## 📊 Data Models

### Clients
```typescript
{
  ClientID: string;
  ClientName: string;
  PriorityLevel: 1-5;
  RequestedTaskIDs: string[];
  GroupTag: string;
  AttributesJSON: Record<string, any>;
}
```

### Workers
```typescript
{
  WorkerID: string;
  WorkerName: string;
  Skills: string[];
  AvailableSlots: number[];
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
}
```

### Tasks
```typescript
{
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string[];
  PreferredPhases: number[] | string;
  MaxConcurrent: number;
}
```

## ✅ Validation Rules

### Core Validations (12 implemented)
1. **Missing required columns** ✅
2. **Duplicate IDs** ✅
3. **Malformed arrays/numbers** ✅
4. **Out-of-range values** ✅
5. **Broken JSON** ✅
6. **Unknown references** ✅
7. **Circular co-run detection** ✅
8. **Phase-window constraints** ✅
9. **Overloaded workers** ✅
10. **Phase-slot saturation** ✅
11. **Skill-coverage matrix** ✅
12. **Max-concurrency feasibility** ✅

### AI-Powered Validations
- **Natural language data retrieval** 🚧
- **AI-based error correction** 🚧
- **Intelligent validation rules** 🚧

## ⚙️ Business Rules

### Rule Types
1. **Co-run**: Tasks that must run together
2. **Slot Restriction**: Limit available slots for groups
3. **Load Limit**: Set maximum load per phase for worker groups
4. **Phase Window**: Restrict tasks to specific phases
5. **Pattern Match**: Apply rules based on regex patterns
6. **Precedence Override**: Define rule priority order

### Natural Language Examples
- "Make tasks T001 and T002 run together"
- "Limit Senior workers to maximum 2 slots per phase"
- "Restrict Enterprise clients to minimum 3 common slots"
- "Task T003 can only run in phases 1-3"

## ⚖️ Prioritization System

### Methods
1. **Weight Sliders**: Direct weight assignment (0-10)
2. **Drag & Drop Ranking**: Visual priority ordering
3. **Pairwise Comparison**: Analytic Hierarchy Process
4. **Preset Profiles**: Predefined strategies

### Criteria
- Fulfillment, Fairness, Priority Level
- Efficiency, Skill Match, Cost Optimization
- Timeline, Quality

## 📤 Export System

### Export Options
1. **Complete Package**: All data + configuration JSON
2. **Individual Files**: Separate CSV downloads
3. **Configuration**: Comprehensive JSON with metadata

### Export Contents
- Validated CSV data files
- Business rules configuration
- Prioritization settings
- Export metadata and validation status

## 🧪 Sample Data

The project includes sample data files for testing:
- `src/samples/sample-clients.csv` - 5 sample clients
- `src/samples/sample-workers.csv` - 8 sample workers  
- `src/samples/sample-tasks.csv` - 8 sample tasks

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Features
1. **Validation Rules**: Add to `src/lib/validators.ts`
2. **Business Rules**: Extend rule types in `src/app/rules/page.tsx`
3. **UI Components**: Create in `src/components/`
4. **Data Types**: Define in `src/types/`

## 🚧 Roadmap

### Phase 1: Core Functionality ✅
- [x] Data ingestion and validation
- [x] Business rules engine
- [x] Prioritization system
- [x] Export functionality

### Phase 2: AI Integration 🚧
- [ ] OpenAI API integration
- [ ] Natural language data retrieval
- [ ] AI rule recommendations
- [ ] Intelligent error correction

### Phase 3: Advanced Features 📋
- [ ] Data persistence
- [ ] User authentication
- [ ] Collaborative editing
- [ ] Advanced analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Next.js and React
- Styled with Tailwind CSS
- Icons from emoji and custom assets
- Sample data inspired by real-world resource allocation scenarios

---

**Data Alchemist** - Transforming spreadsheet chaos into structured, validated, and rule-driven resource allocation configurations. 🔮✨
