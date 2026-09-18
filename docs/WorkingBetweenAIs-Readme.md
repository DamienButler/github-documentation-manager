# Working Between AIs

Use GitHub as the shared source of truth when working between ChatGPT and the VS Code Agent. The two AI sessions do not share conversational memory, so decisions and implementation state should be captured in the repository and pushed before handing work from one AI to the other.

## Recommended workflow

1. Keep `main` as the stable branch.
2. Create a feature branch for one piece of work, for example `ux/hive-search`.
3. Let one AI own implementation on that branch at a time.
4. Commit and push checkpoints regularly.
5. Ask the other AI to review the pushed branch or commit.
6. Make changes based on the review.
7. Merge only when the work has been reviewed and tested.

Do not rely on uncommitted local changes when handing work between AIs. ChatGPT cannot see changes that only exist on your local machine.

## Starting a VS Code Agent session

Before asking the VS Code Agent to make changes, give it the shared project context:

> Read `docs/PRODUCT.md`, `docs/UX-PRINCIPLES.md` and `docs/AI-HANDOFF.md` before making changes.

Then give it the specific task and branch to work on.

## Handing VS Code work back to ChatGPT

Commit and push the work first:

```bash
git status
git add .
git commit -m "Describe the change"
git push
```

Then, in ChatGPT, say:

> Review what the VS Code agent did on `ux/hive-search`.

You can also provide a specific commit SHA when you want the review pinned to an exact version.

## Handing ChatGPT changes back to VS Code

If ChatGPT has made approved changes remotely, update the local repository before continuing in VS Code:

```bash
git fetch origin
git pull --ff-only
```

If the intention is to make the local feature branch exactly match the remote branch:

```bash
git fetch origin
git reset --hard origin/<branch>
```

Only use `reset --hard` when you are sure there are no local changes you need to keep.

## Suggested responsibilities

- **You:** product decisions and final approval.
- **ChatGPT:** product direction, UX review, architecture, security/commercial review, and review of pushed branches or commits.
- **VS Code Agent:** implementation, local code changes, running the application, tests, and debugging.
- **GitHub:** the shared record and source of truth.

Avoid having both AIs actively edit the same branch at the same time. Finish or checkpoint one AI's work, commit and push it, then hand the branch to the other AI.
