# StoryForge AI - Quick Start Guide

## Overview

You have three files to work with:

| File | Purpose | When to Use |
|------|---------|-------------|
| `storyforge-prd-enhanced.md` | Complete specification | Reference for details, schemas, prompts |
| `CLAUDE.md` | Project context | Keep in project root - Claude Code reads this |
| `PROMPT_CHAIN.md` | Step-by-step prompts | Follow these in order |

## Recommended Workflow

### Step 1: Set Up Your Environment

```bash
# Create project directory
mkdir storyforge && cd storyforge

# Copy CLAUDE.md to root
cp /path/to/CLAUDE.md ./CLAUDE.md

# Initialize git
git init
git remote add origin <your-github-repo>
```

### Step 2: Prepare External Services

Before writing any code:

1. **Supabase**
   - Create new project at supabase.com
   - Note: Project URL, Anon Key, Service Role Key
   - Enable the `uuid-ossp`, `vector`, and `pg_trgm` extensions in SQL Editor

2. **Stripe**
   - Create account or use existing
   - Get test mode API keys
   - Create products:
     - "Pro Author" - $15/month recurring
     - Note the Price ID

3. **Anthropic**
   - Get API key from console.anthropic.com

4. **Vercel**
   - Connect GitHub repo
   - Don't deploy yet (wait until Phase 1 complete)

### Step 3: Start Claude Code Session

```bash
# Open Claude Code in your project
claude

# Or if using VS Code extension, open the project
```

### Step 4: Begin Phase 1

Copy **Prompt 1.1** from PROMPT_CHAIN.md and paste it into Claude Code.

Wait for completion, then verify before moving to 1.2.

### Step 5: Iterate Through Phases

After each phase:
1. Run the checkpoint verification prompt
2. Fix any issues before proceeding
3. Update CLAUDE.md's "Current Phase" section
4. Commit your changes:
   ```bash
   git add .
   git commit -m "Complete Phase X: [description]"
   git push
   ```

## Tips for Success

### Keep Context Fresh
If Claude Code seems to forget project structure:
- Reference CLAUDE.md explicitly: "Check CLAUDE.md for the project structure"
- Paste relevant sections from the PRD when needed

### Handle Long Prompts
Some prompts (like the SQL schema) are very long:
- Create the file manually if Claude Code truncates
- Or split into multiple messages: "Here's part 1 of the schema..."

### Debug Effectively
When something breaks:
1. Share the exact error message
2. Share relevant code files
3. Ask Claude Code to diagnose and fix

### Customize As You Go
The PRD is a starting point. Feel free to:
- Adjust UI/UX to your taste
- Add features you think of
- Skip features you don't need for MVP

## Time Estimates

| Phase | Estimated Time | Complexity |
|-------|---------------|------------|
| 1. Foundation | 2-4 hours | Low |
| 2. Database | 2-3 hours | Medium |
| 3. Graph | 4-6 hours | High |
| 4. Books/Chapters | 3-4 hours | Medium |
| 5. Editor | 4-6 hours | High |
| 6. AI Integration | 4-6 hours | High |
| 7. Payments | 2-3 hours | Medium |
| 8. Polish | 4-8 hours | Medium |

**Total: ~25-40 hours** of active development time

## Common Pitfalls to Avoid

1. **Skipping Checkpoints** - Bugs compound; verify each phase
2. **Ignoring TypeScript Errors** - Fix them immediately
3. **Forgetting RLS** - Test that users can't access others' data
4. **Not Testing Webhooks** - Use Stripe CLI locally
5. **Over-Engineering Early** - Get basics working first, polish later

## Need Help?

If you get stuck:
1. Check the Troubleshooting section in PROMPT_CHAIN.md
2. Share the issue with Claude Code with full context
3. Reference the PRD for intended behavior
4. Check Supabase/Stripe/Vercel docs for their specific APIs

Good luck building StoryForge! 🚀
