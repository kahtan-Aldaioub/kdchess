import WebSocket, { RawData } from "ws";
import { Chess } from 'chess.js';
import { GAME_OVER, INIT_GAME, MOVE, UPDATE_TIME } from "./messages";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    public board: Chess;
    private moveCount = 0;
    private onGameOver: (game: Game, winner: WebSocket | null) => void;
    private whiteTime: number;
    private blackTime: number;
    private whiteTimerRef: NodeJS.Timeout | null = null;
    private blackTimerRef: NodeJS.Timeout | null = null;

    constructor(player1: WebSocket, player2: WebSocket, timeControl: number, onGameOver: (game: Game, winner: WebSocket | null) => void) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Chess();
        this.onGameOver = onGameOver;
        this.whiteTime = timeControl;
        this.blackTime = timeControl;
        
        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "w",
                timeControl: timeControl
            }
        }));
        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "b",
                timeControl: timeControl
            }
        }));

        this.player1.on("message", (message: RawData) => this.handleMessage(this.player1, message));
        this.player2.on("message", (message: RawData) => this.handleMessage(this.player2, message));

        this.startTimer("w");
    }

    private handleMessage(player: WebSocket, message: RawData) {
        const parsedMessage = JSON.parse(message.toString());

        if (parsedMessage.type === MOVE) {
            this.makeMove(player, parsedMessage.payload.move);
        }
    }

    private startTimer(color: "w" | "b") {
        this.clearTimers();

        if (color === "w") {
            this.whiteTimerRef = setInterval(() => {
                this.whiteTime--;
                this.broadcastTime();
                if (this.whiteTime <= 0) {
                    this.onGameOver(this, this.player2);
                }
            }, 1000);
        } else {
            this.blackTimerRef = setInterval(() => {
                this.blackTime--;
                this.broadcastTime();
                if (this.blackTime <= 0) {
                    this.onGameOver(this, this.player1);
                }
            }, 1000);
        }
    }

    private clearTimers() {
        if (this.whiteTimerRef) {
            clearInterval(this.whiteTimerRef);
            this.whiteTimerRef = null;
        }
        if (this.blackTimerRef) {
            clearInterval(this.blackTimerRef);
            this.blackTimerRef = null;
        }
    }

    private broadcastTime() {
        this.player1.send(JSON.stringify({
            type: UPDATE_TIME,
            payload: {
                w: this.whiteTime,
                b: this.blackTime
            }
        }));
        this.player2.send(JSON.stringify({
            type: UPDATE_TIME,
            payload: {
                w: this.whiteTime,
                b: this.blackTime
            }
        }));
    }

    makeMove(player: WebSocket, move: { from: string; to: string }) {
        // Validate the type of move
        if (this.moveCount % 2 === 0 && player !== this.player1) {
            return;
        }
        if (this.moveCount % 2 === 1 && player !== this.player2) {
            return;
        }

        try {
            this.board.move(move);
        } catch (e) {
            console.log(e);
            return;
        }

        this.moveCount++;

        // Notify both players of the move
        this.player1.send(JSON.stringify({
            type: MOVE,
            payload: move
        }));
        this.player2.send(JSON.stringify({
            type: MOVE,
            payload: move
        }));

        // Switch timer
        this.startTimer(this.board.turn());

        if (this.board.isDraw()) {
            this.onGameOver(this, null);
            return;
        }
        // Check for game over
        if (this.board.isGameOver()) {
            const winner = this.board.turn() === "w" ? this.player2 : this.player1;
            this.onGameOver(this, winner);
            return;
        }
    }
}
