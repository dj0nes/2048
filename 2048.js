const readline = require('readline');

class Board {
    constructor(board_size=4, board_array) {
        this.board_size = board_size
        if(board_array !== undefined && Array.isArray(board_array) && board_array.length === board_size * board_size) {
            this.board = board_array
        }
        else {
            this.board = []
            for(let i = 0; i < board_size * board_size; i++) {
                this.board.push(0)
            }
        }
        this.tokens = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]
        this.transitions = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]
        this.boardTransitions = {
            up:    {type: 'columns', reverse: false},
            down:  {type: 'columns', reverse: true},
            left:  {type: 'rows', reverse: false},
            right: {type: 'rows', reverse: true}
        }
    }

    makeBoard() {
        let board = []
        for(let i = 0; i < this.board_size * this.board_size; i++) {
            // board[i] = i % this.board_size
            board[i] = 2
        }
        return board
    }

    printBoard() {
        let row = '';
        for(let i = 0; i <= this.board.length; i++) {
            if(i % this.board_size === 0) {
                console.log(row)
                row = ''
            }

            row += '\t' + this.board[i]
        }
    }

    getColumn(index) {
        let column = []
        for(let i = 0; i < this.board.length; i++) {
            if( i % this.board_size === index) {
                column.push(this.board[i])
            }
        }

        return column
    }

    getRow(index) {
        let row = []
        for(let i = 0; i < this.board.length; i++) {
            if( Math.floor(i / this.board_size) === index) {
                row.push(this.board[i])
            }
        }

        return row
    }

    transition(token) {
        let index = this.tokens.indexOf(token)
        if(index >= 0) {
            return this.transitions[index]
        }
        else {
            console.error('invalid token')
        }
    }

    insertTokenAtRandom(index, value) {
        let zero_indices = this.board.reduce(function(accum, val, index) {
            if(val === 0) {
                accum.push(index)
            }
            return accum
        }, [])

        if(zero_indices.length === 0) {
            return this.board
        }

        let random_index = Math.random()
        let random_value = Math.random()

        let new_value = random_value <= 0.9 ? this.tokens[0] : this.tokens[1]
        if(value !== undefined) {
            new_value = value
        }

        let new_index = Math.floor(random_index * zero_indices.length)
        if(index !== undefined) {
            new_index = index
        }

        this.board[zero_indices[new_index]] = new_value

        return this.board
    }

    transformArray(arr) {
        // this performs the smushing of tokens recursively, assuming smush left

        let helper = (arr) => {
            if(arr.length === 1) {
                return arr
            }
            if(arr.length === 0) {
                return []
            }
            if(arr.every(el => el === 0)) {
                return arr
            }

            let numbers = arr.filter(el => el !== 0);
            let first = numbers.shift()
            let second = numbers.shift() || 0

            if(first === second) {
                let next = this.transition(first)
                return [next].concat(helper(numbers))
            }
            else {
                return [first].concat(helper([second, ...numbers]))
            }
        }

        let transformed = helper(arr)

        // perform zero padding if necessary
        if(transformed.length < this.board_size) {
            while(transformed.length < this.board_size) {
                transformed.push(0)
            }
        }

        return transformed
    }

    transformBoard(direction) {
        if(!this.boardTransitions.hasOwnProperty(direction)) {
            console.error('invalid move')
            return this.board
        }

        let type = this.boardTransitions[direction].type
        let reverse = this.boardTransitions[direction].reverse

        let data = []
        if(type === 'columns') {
            for(let i = 0; i < this.board_size; i++) {
                let res = this.getColumn(i)
                data.push(res)
            }
        }
        else {
            for(let i = 0; i < this.board_size; i++) {
                let res = this.getRow(i)
                data.push(res)
            }
        }

        if(reverse) {
            for(let i = 0; i < data.length; i++) {
                data[i] = data[i].reverse()
            }
        }

        // do the transformation!
        for(let i = 0; i < data.length; i++) {
            data[i] = this.transformArray(data[i])
            if(reverse) {
                data[i] = data[i].reverse()
            }
        }

        // flatten the resulting array in the appropriate direction
        if(type === 'columns') {
            let new_board = []
            for(let i = 0; i < this.board_size; i++) {
                for(let j = 0; j < this.board_size; j++) {
                    let res = data[j][i]
                    new_board.push(res)
                }
            }
            this.board = new_board
        }
        else {
            this.board = data.reduce((accumulator, arr) => accumulator.concat(arr))
        }

        return this.board
    }
}
class Game {
    constructor(board) {
        if(board === undefined) {
            this.board = new Board(4)
            this.board.insertTokenAtRandom()
            this.board.insertTokenAtRandom()
        }
        else {
            this.board = board
        }

        this.board.printBoard()

        this.moveAliases = { w: 'up', s: 'down', a: 'left', d: 'right' }
        this.movesMade = 0
        this.score = 0
        this.readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    play() {
        this.readline.question('\nMove (W, A, S, D): ', (direction) => {
            this.makeMove(direction)
            this.board.printBoard()
            this.play()
            // rl.close()
        })
    }

    makeMove(direction) {
        let legal_move = this.getLegalMove(direction)
        if(!legal_move) {
            console.error('invalid move, bruh')
            return
        }

        let previous_board = this.board.board
        this.board.transformBoard(legal_move)

        if(this.board.toString() === previous_board.toString()) {
            // nothing changed! This is an illegal move, so revert and return
            this.board.board = previous_board
            return
        }

        if(this.isGameLost()) {
            this.handleGameLost()
        }

        if(this.isGameWon()) {
            this.handleGameWon()
        }

        this.movesMade++
        this.board.insertTokenAtRandom()
    }

    getLegalMove(direction) {
        let the_move = direction.toLowerCase()
        if(this.moveAliases.hasOwnProperty(the_move)) {
            the_move = this.moveAliases[the_move]
        }

        if(this.board.boardTransitions.hasOwnProperty(the_move)) {
            return the_move
        }
        else {
            return false
        }
    }

    isGameLost() {
        return this.board.board.every(el => el > 0)
    }

    isGameWon() {
        return this.board.board.some(el => el === this.board.tokens[this.board.tokens.length - 1])
    }

    handleGameLost() {
        console.log('You lose! Hah!')
        process.exit(1)
    }

    handleGameWon() {
        console.log('You win! Amazing!')
        process.exit(0)
    }
}

function tests() {
    let board = new Board(4)
    board.board = board.makeBoard()
    board.printBoard()
    console.log(board.getColumn(0))
    console.log(board.getRow(3))
    console.log(board.transition(1024))
    console.log(board.transformArray([2, 8, 4, 4]))
    board.transformBoard('down')
    board.printBoard()
    board.insertTokenAtRandom(0, 4)
    board.printBoard()
    board.insertTokenAtRandom()
    board.printBoard()
}

let g = new Game()
g.play()