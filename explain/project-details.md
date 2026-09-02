# FPL Report - Project Documentation

## Overview

FPL Report is a Fantasy Premier League management application that provides live squad dashboards, deterministic decision engines, and optional AI-powered gameweek reports. The project is built in three phases:

- **Phase 1**: Live squad dashboard with real-time FPL data
- **Phase 2**: Deterministic decision engine for lineup optimization
- **Phase 3**: AI explanation layer for gameweek insights

## Tech Stack

### Core Framework
- **Next.js**: 16.3.3 (React framework with App Router)
- **React**: 19.2.8
- **React DOM**: 19.2.8
- **TypeScript**: 5.x

### Styling & UI
- **TailwindCSS**: v4 (utility-first CSS framework)
- **Lucide React**: 1.39.0 (icon library)

### Validation & Data
- **Zod**: 4.5.4 (schema validation)

### Testing
- **Vitest**: 4.1.11 (unit testing framework)

### Development Tools
- **ESLint**: 9.x (code linting)
- **PostCSS**: CSS processing

## Project Structure

```
FPL/
├── app/                      # Next.js App Router
│   ├── (app)/               # Route group for dashboard pages
│   │   ├── analysis/        # Analysis page
│   │   ├── report/          # AI report page
│   │   └── squad/           # Squad dashboard page
│   ├── api/                 # API routes
│   │   └── report/          # Report generation endpoint
│   ├── dashboard/           # Dashboard layout components
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── error.tsx            # Error boundary
├── components/              # React components
│   ├── Analysis.tsx         # Analysis dashboard component
│   ├── Bench.tsx            # Bench display component
│   ├── CaptainCard.tsx      # Captain selection card
│   ├── DashboardNav.tsx     # Dashboard navigation
│   ├── DashboardShell.tsx   # Dashboard layout shell
│   ├── Fixture.tsx          # Fixture display component
│   ├── Pitch.tsx            # Football pitch visualization
│   ├── PlayerCard.tsx       # Player information card
│   ├── Squad.tsx            # Squad display component
│   ├── report/              # Report-specific components
│   ├── sections/            # Section components
│   └── ui/                  # UI components
├── lib/                     # Business logic
│   ├── ai/                  # AI integration layer
│   ├── analysis/            # Decision engine logic
│   ├── fpl/                 # FPL API integration
│   └── format.ts            # Formatting utilities
├── tests/                   # Vitest test files
├── public/                  # Static assets
└── Configuration files
```

## Key Modules

### 1. FPL Integration (`lib/fpl/`)

Handles communication with the Fantasy Premier League API:

- **bootstrap.ts**: Fetches static FPL data (teams, players, events)
- **client.ts**: HTTP client for FPL API requests
- **dashboard-data.ts**: Aggregates data for dashboard display
- **entry.ts**: Fetches manager entry information
- **fixtures.ts**: Fetches fixture data
- **gameweek.ts**: Gameweek information
- **normalize.ts**: Normalizes FPL API responses
- **picks.ts**: Fetches squad picks
- **types.ts**: TypeScript type definitions

**Key Types**:
- `Player`: Normalized player data
- `SquadPlayer`: Player with squad-specific info
- `GameweekInfo`: Current/next gameweek details
- `ManagerInfo`: Manager statistics
- `DashboardData`: Complete dashboard dataset

### 2. Analysis Engine (`lib/analysis/`)

Deterministic decision engine for FPL optimization:

- **bench.ts**: Bench ordering algorithm
- **captain.ts**: Captain selection logic
- **config.ts**: Analysis configuration
- **fixtures.ts**: Fixture difficulty scoring
- **lineup.ts**: Starting XI optimization
- **player.ts**: Player scoring algorithms
- **risk.ts**: Risk assessment logic
- **score.ts**: Overall scoring system
- **team.ts**: Team strength analysis
- **transfers.ts**: Transfer recommendation engine
- **types.ts**: Analysis type definitions

**Key Types**:
- `PlayerAnalysis`: Player with analysis scores
- `GameweekAnalysis`: Complete gameweek analysis
- `TransferRecommendation`: Transfer suggestions
- `RolePick`: Captain/vice-captain selections

**Scoring Factors**:
- Fixture difficulty (home/away)
- Player form and recent performance
- Expected goals/assists
- Minutes played and starts
- Injury and availability risk
- Team strength

### 3. AI Integration (`lib/ai/`)

Optional AI-powered explanation layer:

- **fallback.ts**: Fallback report generation
- **input.ts**: AI input preparation
- **prompts.ts**: AI prompt templates
- **provider.ts**: AI provider abstraction
- **report.ts**: Report generation orchestration
- **schema.ts**: Zod validation schemas
- **validate.ts**: Response validation
- **types.ts**: AI type definitions

**Key Types**:
- `AIReportInput`: Input data for AI generation
- `AIReport`: Generated AI report structure
- `ReportResult`: Report with source metadata

**Supported AI Providers**:
- OpenAI (configurable via environment variables)

## Application Routes

### `/squad`
- Displays current squad with live FPL data
- Shows starting XI, bench, and captain
- Displays upcoming fixtures
- Shows manager statistics and league position

### `/analysis`
- Deterministic decision engine output
- Recommended formation and starting XI
- Captain and vice-captain recommendations
- Lineup change suggestions
- Player risk assessments
- Transfer recommendations
- Fixture outlook for squad players

### `/report`
- AI-generated gameweek report (optional)
- Executive summary
- Detailed explanations for recommendations
- Short-term and medium-term outlooks
- Fallback to deterministic output if AI unavailable

## Configuration

### Environment Variables (`.env.local`)

```env
FPL_ENTRY_ID=3944035              # Your FPL entry ID
AI_PROVIDER=openai                # AI provider (openai)
OPENAI_API_KEY=                   # OpenAI API key
OPENAI_MODEL=gpt-4o-mini          # OpenAI model
AI_TIMEOUT_MS=60000               # AI request timeout
```

### Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Vitest tests
- `npm run test:watch` - Run tests in watch mode

## Testing

Test files are located in the `tests/` directory:

- **ai-provider.test.ts**: AI provider integration tests
- **ai.test.ts**: AI generation logic tests
- **analysis.test.ts**: Analysis engine tests
- **normalize.test.ts**: Data normalization tests
- **squad.test.ts**: Squad data tests
- **transfers.test.ts**: Transfer recommendation tests

Run tests with:
```bash
npm test
```

## Key Features

### Deterministic Decision Engine
The analysis engine uses a scoring system based on:
- **Fixture Difficulty**: FPL's official difficulty ratings (1-5)
- **Player Form**: Recent performance metrics
- **Expected Points**: FPL's predicted points (ep_next)
- **Expected Goals/Assists**: Statistical projections
- **Minutes Risk**: Assessment of playing time certainty
- **Availability Risk**: Injury and suspension considerations

### Transfer Recommendations
The engine evaluates:
- Current squad value and bank
- Potential point gains from transfers
- Transfer costs and hit penalties
- Short-term fixture schedules
- Long-term team outlook

### Risk Assessment
Players are categorized by risk level:
- **LOW**: Reliable starters with good fixtures
- **MEDIUM**: Some uncertainty but generally safe
- **HIGH**: Injury doubts, poor fixtures, or limited minutes

## Scope & Limitations

### In Scope
- Live FPL data fetching and display
- Deterministic lineup optimization
- AI-powered explanations (optional)
- Transfer recommendations
- Risk assessment

### Out of Scope
- No database storage
- No user authentication
- No automatic transfers (read-only)
- No external news APIs
- No FPL cookie/token storage
- No login credential handling

## TypeScript Configuration

- **Target**: ES2017
- **Module Resolution**: Bundler
- **Strict Mode**: Enabled
- **Path Aliases**: `@/*` maps to project root
- **JSX**: React JSX transform

## Browser Support

Modern browsers supporting ES2017+ features.

## Development Notes

- Next.js 16 has breaking changes from previous versions
- Always check `node_modules/next/dist/docs/` for latest API documentation
- The project uses the App Router pattern
- Server components are used where possible for performance
- AI calls are server-side only via API routes
- Environment variables are never committed to git

## Future Enhancements

Potential areas for expansion:
- Additional AI providers (Anthropic, etc.)
- Historical performance tracking
- Comparison tools between managers
- Advanced fixture analysis
- Custom scoring weights
- Multiple entry support
- League integration
