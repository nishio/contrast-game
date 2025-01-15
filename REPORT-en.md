# Experiment Report 2025-01-13

This experiment investigates the extent to which autonomous AI agents can independently implement solutions as of January 2025.

## Background  
The [Programming Symposium](https://prosym.org/66/) (ProSym) is an annual event in Information Processing Society of Japan. Since its first session in 1960, ProSym has been a forum for lively discussions resulting in numerous innovative ideas.  

One notable feature of ProSym is the [GPCC (Games and Puzzles Competitions on Computers)](https://prosym.org/gpcc/), a subcommittee established in 1972. Each year, GPCC selects a challenge centered around solving games or puzzles with computers, fostering competition and collaboration among participants.

During the 2025 Programming Symposium, held from January 10 to 12, a game called "[Contrast](https://029products-contrast.studio.site/)" was introduced. Participants explored the game by using AI to review its rules for clarity and analyze strategies. This led to the idea of tasking an autonomous AI agent with implementing the game.  

The experiment aimed to determine whether an AI agent could autonomously create a fully functional game server for "Contrast" during the symposium period.

## Methodology  
Devin.ai was used for this experiment. The interactions and instructions exchanged with the AI agent are documented in [CHATLOG.md](CHATLOG.md).

## Results  
As of January 2025, the goal of having the AI agent autonomously complete a game server for "Contrast" during the symposium period was not achieved.  
- **Frontend**: The system allowed for a human-vs-human mode with alternating turns.  
- **Rule Misinterpretations**: The AI failed to understand certain rules, such as the ability to move pieces laterally. Additionally, it incorrectly assumed that pieces could "jump over" the opponent's pieces.  
- **Backend**: The AI generated code for a game server capable of managing board states according to the rules and an AI opponent selecting moves randomly from valid options. However, due to the rule misinterpretations, the implementation quality was insufficient for direct use.  

## Discussion  
While the results in January 2025 were not fully successful, it seems feasible that by the 2026 ProSym, an AI agent could autonomously complete a game server for a game introduced at the event.  

One significant bottleneck was the time spent on environment setup of human reviewer. Once a functioning reference implementation is available, subsequent efforts could proceed more smoothly by leveraging the reference as a guide.  

Another issue was that the AI spent considerable real-time resources on operating the browser for manual testing. Introducing a UI testing framework and having the AI describe testing scenarios in test code rather than natural language could improve efficiency.  

Finally, when humans tested the UI or reviewed generated test cases, it became evident that the AI misunderstood some rules. These misunderstandings were not apparent during natural language exchanges with the AI. For complex game rules or similar scenarios, generating test cases for human review before proceeding seems to be a more reliable approach.
