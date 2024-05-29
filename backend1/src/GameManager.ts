import WebSocket, { RawData } from "ws";
import { INIT_GAME, MOVE, GAME_OVER } from "./messages";
import { Game } from "./Game";

export class GameManager {
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: WebSocket[];

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }

    addUser(socket: WebSocket) {
        this.users.push(socket);
        this.addHandler(socket);
    }

    removeUser(socket: WebSocket) {
        this.users = this.users.filter(user => user !== socket);
        // End the game if a user leaves
        const game = this.games.find(game => game.player1 === socket || game.player2 === socket);
        if (game) {
            this.endGame(game, game.player1 === socket ? game.player2 : game.player1);
        }
    }

    private addHandler(socket: WebSocket) {
        socket.on("message", (data: RawData) => {
            const message = JSON.parse(data.toString());

            if (message.type === INIT_GAME) {
                if (this.pendingUser) {
                    const game = new Game(this.pendingUser, socket, message.payload.timeControl, this.onGameOver.bind(this));
                    this.games.push(game);
                    this.pendingUser = null;
                } else {
                    this.pendingUser = socket;
                }
            }

            if (message.type === MOVE) {
                const game = this.games.find(game => game.player1 === socket || game.player2 === socket);
                if (game) {
                    game.makeMove(socket, message.payload.move);
                }
            }
        });

        socket.on("close", () => {
            this.removeUser(socket);
        });
    }

    private onGameOver(game: Game, winner: WebSocket | null) {
        const loser = winner === game.player1 ? game.player2 : game.player1;
        this.broadcast(game, { type: GAME_OVER, payload: { winner: winner ? (winner === game.player1 ? "Player 1" : "Player 2") : "Draw" } });
        this.games = this.games.filter(g => g !== game);
    }

    private endGame(game: Game, winner: WebSocket | null) {
        this.onGameOver(game, winner);
    }

    private broadcast(game: Game, message: any) {
        game.player1.send(JSON.stringify(message));
        game.player2.send(JSON.stringify(message));
    }
}
