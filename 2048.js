class Board {
    constructor(board_size) {
        this.board_size = board_size
        this.board = []
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

            row += ' ' + this.board[i]
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

    transformArray(arr) {
        // this performs the smushing of tokens recursively, assuming smush left

        let helper = (arr) => {
            if(arr.length === 1) {
                return arr
            }
            if(arr.length === 0) {
                return []
            }

            let numbers = arr.filter(el => el !== 0);
            let first = numbers.shift()
            let second = numbers.shift()

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

let board = new Board(4)
board.board = board.makeBoard()
board.printBoard()
console.log(board.getColumn(0))
console.log(board.getRow(3))
console.log(board.transition(1024))
console.log(board.transformArray([2, 8, 4, 4]))
board.transformBoard('down')
board.printBoard()