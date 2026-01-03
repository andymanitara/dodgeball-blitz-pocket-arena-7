# Dodgeball Blitz: Pocket Arena

[aureliabutton]

A comedic, high-energy 1v1 dodgeball game played in portrait mode on mobile. The game features a 2.5D visual style where 3D characters and balls interact on a stylized court with depth, while controls remain simple and arcade-like.

## Overview

**Dodgeball Blitz: Pocket Arena** places players in a "Kid Playful" aesthetic world where they control a 'Blue' hero on the bottom half of the court against a 'Red' AI bot on the top half. The core gameplay involves moving with a virtual joystick, picking up physics-based balls, and throwing them to hit the opponent while dodging incoming attacks.

The game is built for performance and visual flair, utilizing React Three Fiber for the 3D environment and Cloudflare Workers for the backend infrastructure.

## Key Features

*   **1v1 Arcade Action:** Fast-paced "Best of 3" rounds against a challenging AI bot.
*   **Portrait-First Design:** Optimized for mobile play with intuitive one-handed or two-thumb controls.
*   **2.5D Visuals:** A unique blend of 3D geometry and flat, vibrant textures for a distinct look.
*   **Physics-Based Gameplay:** Realistic ball trajectories, bounces, and collisions.
*   **Comedic Tone:** Exaggerated ragdoll physics and "BONK!" style visual effects.
*   **Responsive Controls:** Virtual analog stick for movement and dedicated buttons for Throw and Dodge actions.

## Technology Stack

This project is built using a modern, high-performance stack:

*   **Runtime:** [Cloudflare Workers](https://workers.cloudflare.com/)
*   **Framework:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **3D Engine:** [Three.js](https://threejs.org/) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) & [@react-three/drei](https://github.com/pmndrs/drei)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Backend API:** [Hono](https://hono.dev/)

## Getting Started

### Prerequisites

*   [Bun](https://bun.sh/) (v1.0.0 or higher)
*   Node.js (for compatibility)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd dodgeball-blitz
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

### Development

To start the local development server:

```bash
bun run dev
```

This will start the Vite server, typically at `http://localhost:3000`.

### Building for Production

To create a production build:

```bash
bun run build
```

## Project Structure

*   `src/`: Frontend source code
    *   `components/`: Reusable UI components (Shadcn, Layouts)
    *   `hooks/`: Custom React hooks
    *   `pages/`: Application views (Home, Game Arena)
    *   `lib/`: Utilities and helper functions
*   `worker/`: Cloudflare Worker backend code
    *   `index.ts`: Main entry point for the worker
    *   `userRoutes.ts`: API route definitions
*   `public/`: Static assets

## Deployment

This project is configured to deploy to Cloudflare Workers.

[aureliabutton]

### Manual Deployment

1.  Ensure you have `wrangler` installed and authenticated:
    ```bash
    bun add -d wrangler
    bun x wrangler login
    ```

2.  Deploy the project:
    ```bash
    bun run deploy
    ```

## License

This project is licensed under the MIT License.