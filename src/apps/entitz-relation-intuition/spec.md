This should become a sub-app for practicing intuition to draw basic ER-systems for IT for business cases, e.g.

- A shop sells 3 types of juice and needs to track their inventory
- Represent a bus companies stops, routes and zones as an ER diagram
- You want to make a basic messaging app where users can sign up and chat with their friends

We want to represent the cases as json in public/, following the pattern of other apps here.
For now, simply make up 50 cases, and 3 examples per case, where you simply draw SIMPLE!! possible ER diagrams as a mermaid string. Limit to 3-5 objects. The idea is not to be necessarily comprehensive and super detailled, but to gain a basic intuition of rendering the real world to abstract db models. Keep the scenarios short as well.

The app should have a concept for i18n and be available in en and de, including the data! Represent this usefully. 
The learning flow in the app should be very simple:
Show a prompt and a scenario, and a "reveal example solutions" button.
Once clicked, render the mermaid diagrams (make sure works well on mobile+desktop) and offer a self-rating scale
for confidence/correctness w/ 5 buttons.
Score the answer w/ ts-fsrs, persisting learning data via dexie. 
For exercise selection: First prefer showing random new (=never done) exercises, if no more are new, pick random due according to fsrs, if none due, pick lowest retention % according to fsrs.

Keep it lean, do not overdesign.
Prototype!
Stick to @./agents.md.
Use daisy+tailwind+lucide. 