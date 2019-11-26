import React from 'react';
import {StyleSheet, Text, View, TextInput, Image, ImageBackground} from 'react-native';
import socketIOClient from 'socket.io-client';
import {Button} from "react-native";
import BootstrapStyleSheet from 'react-native-bootstrap-styles';

/**
 * @return {null}
 */
function DisplayConstraints(props) {
    const constraintsTextStyleBad = [s.text, s.h6, s.myXs1, s.myMd3, s.textCenter, {color: 'red'}];
    const constraintsTextStyleGood = [s.text, s.h6, s.myXs1, s.myMd3, s.textCenter, {color: 'green'}];
    let isUnique = props.uniqueConstraint;
    let hasLength = props.lengthConstraint;

    if (isUnique === false && hasLength === false) {
        return (
            <Text style={constraintsTextStyleBad}>
                Please enter a number that doesn't contain duplicates!
                {"\n"}
                Enter a 4 digit number.
            </Text>
        )
    } else if (isUnique === false && hasLength === true) {
        return <Text style={constraintsTextStyleBad}>Please enter a number that doesn't contain duplicates!</Text>
    } else if (isUnique === true && hasLength === false) {
        return <Text style={constraintsTextStyleBad}>Enter a 4 digit number</Text>
    } else {
        return <Text style={constraintsTextStyleGood}>Your number is good.</Text>
    }
}

export default class Number extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            myTurn: null,
            response: false,
            endpoint: "http://307e2e68.ngrok.io",
            socket: null,
            number: null,
            guessedNumber: null,
            uniqueConstraint: false,
            lengthConstraint: false,
            numberSet: false,
            movesMade: []
        };
        this.baseState = this.state;
    }

    renderTurnMessage() {
        let message;
        if (this.state.myTurn === false) {
            message = "Your opponent's turn";
        } else if (this.state.myTurn === true) {
            message = "Your turn";
        } else if (this.state.myTurn === null) {
            message = "Please wait for an opponent..."
        }
        return <Text p>{message}</Text>
    }

    handleNameInput = (inputName) => {
        this.setState({
            name: inputName
        })
    };

    checkUnique = (inputNumber) => {
        let uniqueNumberLength = new Set(inputNumber).size;
        return uniqueNumberLength === inputNumber.length;
    };

    checkLength = (inputNumber) => {
        return inputNumber.length === 4;
    };

    handleNumberInput = (inputNumber) => {
        let checkLength = this.checkLength(inputNumber);
        let checkUnique = this.checkUnique(inputNumber);
        if (checkLength && checkUnique) {
            this.setState({
                number: inputNumber,
                lengthConstraint: true,
                uniqueConstraint: true,
            })
        } else if (!checkLength && !checkUnique) {
            this.setState({
                number: null,
                lengthConstraint: false,
                uniqueConstraint: false,
            })
        } else if (!checkUnique && checkLength) {
            this.setState({
                number: null,
                lengthConstraint: true,
                uniqueConstraint: false,
            })
        } else if (checkUnique && !checkLength) {
            this.setState({
                number: null,
                lengthConstraint: false,
                uniqueConstraint: true,
            })
        }
    };

    handleGuessedNumberInput = (inputNumber) => {
        this.setState({
            guessedNumber: inputNumber
        })
    };

    makeMove = () => {
        const {socket} = this.state;
        socket.emit('make.move', {
            guessedNumber: this.state.guessedNumber
        });
    };

    setNumber = () => {
        const {socket} = this.state;

        this.setState({
            numberSet: true
        });

        socket.emit('set.number', {
            myNumber: this.state.number
        });
    };

    componentDidMount() {
        const {socket} = this.state;

        socket.on('activeUsers', data => this.setState({response: data}));

        socket.on('game.begin', data => {
            this.setState({
                myTurn: data.myTurn
            })
        });

        socket.on('move.made', (data) => {
            if (data.guessedNumber === this.state.number) {
                socket.emit('opponent.won');
            }
            this.setState({
                myTurn: !this.state.myTurn
            })
        });

        socket.on('gameEnds', data => {
            alert(data.message);
            this.setState(this.baseState);
        });

        socket.on('found.values', data => {
            this.setState({
                movesMade: this.state.movesMade.concat(`${this.state.guessedNumber} -> ${data.foundValuesMessage}`)
            })
        });

        socket.on('opponent.left', () => {
            this.setState({
                myTurn: null
            });
            alert("Your opponent has left the game.");
            this.setState(this.baseState);
        })
    }

    componentWillMount() {
        const {endpoint} = this.state;
        const socket = socketIOClient(endpoint);

        this.setState({
            socket: socket
        });
    }

    render() {
        const {response} = this.state;
        const validNumber = this.state.number;
        const message = this.renderTurnMessage();
        const {myTurn} = this.state;
        const {numberSet} = this.state;
        const {movesMade} = this.state;
        const {socket} = this.state;
        return (
            <View style={[s.body]}>
                    <View style={[s.container, s.h100, s.justifyContentCenter]}>

                        <Text p>{response === 1 ? < Text p>There is {response} user connected.</Text> : response > 1 ?
                            <Text p>There are {response} users connected.</Text> :
                            <Text p>Loading active users.</Text>}</Text>

                        <Text
                            style={[s.text, s.h3, s.textPrimary, s.myXs1, s.myMd3, s.textCenter]}>{numberSet ? message :
                            <Text h2>Introduce your number and start playing!</Text>}</Text>

                        {numberSet ?
                            <View>
                                <Text style={[s.text, s.h5, s.myXs1, s.myMd3, s.textCenter]}>Find your opponent's
                                    number</Text>
                                <TextInput style={[s.text, s.textCenter, {fontSize: 2 * c.REM}]}
                                           placeholder="Type your opponent's number" keyboardType={'numeric'}
                                           onChangeText={this.handleGuessedNumberInput} clearTextOnFocus={true}/>
                            </View> :
                            <View>
                                <TextInput style={[s.text, s.textCenter, {fontSize: 3 * c.REM}]}
                                           placeholder="Type your number" keyboardType={'numeric'}
                                           onChangeText={this.handleNumberInput}/>

                                <DisplayConstraints uniqueConstraint={this.state.uniqueConstraint}
                                                    lengthConstraint={this.state.lengthConstraint}/>
                            </View>
                        }

                        {validNumber && numberSet ? <Text p></Text> :
                            <Button onPress={this.setNumber} title="Tap to play!"/>}

                        {numberSet ? (myTurn ? <Button onPress={this.makeMove} title="Check opponent's number"/> :
                            <Button disabled={true} onPress={this.makeMove} title="Check opponent's number"/>) :
                            <Text></Text>}

                        {movesMade.length ? movesMade.map((data, i) => {
                            return (<Text style={[s.text, s.h5, s.myXs1, s.myMd3, s.textCenter]} key={i}>{data}</Text>)
                        }) : <Text style={[s.text, s.h6, s.myXs1, s.myMd3, s.textCenter]} p>No moves made</Text>}

                        <Button onPress={() => socket.on('opponent.left', () => {
                            this.setState({
                                myTurn: null
                            });
                            alert("Your opponent has left the game.");
                            this.setState(this.baseState);
                        })} title={"Reconnect"}/>
                    </View>
            </View>
        );
    }
}

// const styles = StyleSheet.create({
//     backgroundImage:{
//         flex: 1,
//         width: '100%',
//         height: '100%',
//         justifyContent: "center",
//         alignItems: "center",
//         opacity: 0.7
//     },
// });

const
    BODY_COLOR = '#000022',
    TEXT_MUTED = '#888888';

// custom constants
let constants = {
    BODY_COLOR, TEXT_MUTED,
};

// custom classes
const classes = {
    title: {
        color: 'red',
    }
};

const bootstrapStyleSheet = new BootstrapStyleSheet(constants, classes);
const s = styles = bootstrapStyleSheet.create();
const c = constants = bootstrapStyleSheet.constants;