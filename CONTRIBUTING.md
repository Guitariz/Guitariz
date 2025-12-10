# Contributing to Guitariz

First of all, thank you for your interest in contributing to Guitariz! We're excited to have community members help make this project even better.

## 📋 Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct:

- Be respectful and inclusive
- Welcome new contributors
- Focus on constructive feedback
- Report unacceptable behavior to the maintainers

## 🐛 Found a Bug?

Before creating a bug report, please check the [issue list](https://github.com/abhi9vaidya/guitariz/issues) as you might find out that you don't need to create one.

When creating a bug report, please include as many details as possible:

- **Use a clear, descriptive title**
- **Describe the exact steps** which reproduce the problem
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior** you observed after following the steps
- **Explain which behavior** you expected to see instead and why
- **Include screenshots/videos** if possible
- **Mention your environment**: OS, browser version, Node.js version

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. Chrome, Safari]
 - Node version: [e.g. 16.x]
```

## 💡 Suggesting Enhancements

Enhancement suggestions are tracked as [GitHub discussions](https://github.com/abhi9vaidya/guitariz/discussions). When suggesting an enhancement, please include:

- **Use a clear, descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Provide specific examples** to demonstrate the steps
- **Describe the current behavior** and **expected behavior**
- **Explain why** this enhancement would be useful

## 🚀 Getting Started with Development

### Prerequisites

- Node.js 16+
- npm or pnpm
- Git
- A GitHub account

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/guitariz.git
   cd guitariz/rift-rhythm
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/abhi9vaidya/guitariz.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Project Structure

```
src/
├── components/       # React components
├── hooks/           # Custom hooks
├── lib/             # Utility functions
├── types/           # TypeScript definitions
├── data/            # Static data
├── pages/           # Page components
├── App.tsx          # Main component
└── index.css        # Global styles
```

### Key Files

- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration

## 📝 Making Changes

### Code Style Guidelines

- Use **TypeScript** for all new code
- Follow **Prettier** formatting (configured in ESLint)
- Use **meaningful variable and function names**
- Add **comments for complex logic**
- Keep **functions small and focused**

### Naming Conventions

- Components: `PascalCase` (e.g., `Fretboard.tsx`)
- Hooks: `camelCase` starting with `use` (e.g., `useKeyboardFretboard.ts`)
- Types: `PascalCase` (e.g., `ChordTypes.ts`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_BPM`)

### Linting & Formatting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint -- --fix

# The project uses Prettier for automatic formatting
```

### Testing Your Changes

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:4173` to test your changes.

## 🔄 Submitting Changes

### Git Workflow

1. **Keep your fork updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: add keyboard shortcut for metronome"
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Click "New Pull Request" on GitHub
   - Ensure the PR title clearly describes the changes
   - Include a detailed description of what changed and why
   - Link any related issues using `Closes #123`

### Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only
- `style`: Changes that don't affect code meaning
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests
- `chore`: Changes to build process, dependencies, etc.

Examples:
```
feat(fretboard): add keyboard support for playing notes
fix(chord-detection): handle edge case with diminished chords
docs: update installation instructions
perf: optimize animation performance
```

### Pull Request Guidelines

- **One feature per PR** - Keep PRs focused and reviewable
- **Update documentation** - If adding new features
- **Add tests** - For new functionality (if applicable)
- **Reference issues** - Use `Closes #123` in PR description
- **Be responsive** - Address code review feedback promptly
- **Keep it clean** - Squash commits before merge if needed

## 📚 Documentation

If your contribution adds or changes functionality:

1. **Update README.md** - Add to features or usage section
2. **Update code comments** - Explain complex logic
3. **Update TypeScript types** - Ensure proper typing
4. **Add JSDoc comments** - For exported functions and components

Example JSDoc:
```typescript
/**
 * Detects chords from a set of MIDI notes
 * @param midiNotes - Array of MIDI note numbers
 * @param options - Detection options (strictness, maxCandidates)
 * @returns Array of detected chord candidates
 */
export function detectChords(
  midiNotes: number[],
  options?: DetectionOptions
): Chord[] {
  // Implementation
}
```

## 🎯 Development Tips

### Debugging

1. **Use Chrome DevTools** - F12 in browser
2. **React DevTools** - Install browser extension for React debugging
3. **Console logging** - Use `console.log()` for quick debugging
4. **Debugger statement** - Add `debugger;` to pause execution

### Performance

- Use React DevTools Profiler to identify slow renders
- Check bundle size with build output
- Use `npm run preview` to test production performance

### Testing Changes Locally

```bash
# Start dev server
npm run dev

# In another terminal, optionally:
npm run lint
```

## 📋 Checklist Before Submitting PR

- [ ] Code follows style guidelines
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors or warnings
- [ ] Changes are documented
- [ ] Commit messages are descriptive
- [ ] Related issues are linked
- [ ] No unrelated changes included

## 🏆 Recognition

Contributors will be:
- Added to the project README contributors section
- Credited in release notes
- Given proper recognition for significant contributions

## 📞 Questions?

Feel free to:
- Open a [GitHub Discussion](https://github.com/abhi9vaidya/guitariz/discussions)
- Contact maintainers via email
- Join our community Discord

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to Guitariz! 🎸
