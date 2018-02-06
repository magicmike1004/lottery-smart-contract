/**Test cases for Ethereum Lottery Smart Contract.*/
'use strict';

import expectThrow from './helpers/expectThrow';
const Lottery = artifacts.require('../contracts/Lottery.sol');

contract('Lottery', function (accounts) {
    let lottery;

    beforeEach(async function () {
        // Instantiate the Lotter Contract
        lottery = await Lottery.new();
    });

    describe('Contract Creation', function () {
        it('should test that the smart contract is deployed', async function () {
            // Instantiated contract's address should be of address type
            assert.equal(web3.isAddress(lottery.address), true)
        });
    });

    describe('Create Lottery', function () {
        it('shall create the lottery', async function () {
            let ownerBal1 = await web3.eth.getBalance(accounts[0]);
            let res = await lottery.startLottery(10, 100, { value: 100 });
            let ownerBal2 = await web3.eth.getBalance(accounts[0]);
            let[tickets, availableTickets, ticketPrice, gameStatus, winningAmount] = await lottery.getLotteryStatus();
            assert.equal(tickets, 10);
            assert.equal(ticketPrice, 100);
            assert.equal(availableTickets, 9);
            assert.isAbove(ownerBal1, ownerBal2);
            assert.equal(gameStatus, true);
            assert.equal(winningAmount, 100);
            });
        it('shall not allow non owner to create the lottery', async function () {
            await expectThrow(lottery.startLottery(10, 100, { from: accounts[1], value: 100 }));
            let gameStatus = await lottery.getGameStatus();
            assert.equal(gameStatus, false);
        });
        it('shall not allow owner to create the lottery with 1 ticket and 0 price', async function () {
            await expectThrow(lottery.startLottery(1, 0, { value: 100 }));
            let gameStatus = await lottery.getGameStatus();
            assert.equal(gameStatus, false);
        });
        it('shall not allow owner to create the lottery with less ticket price', async function () {
            await expectThrow(lottery.startLottery(10, 100, { value: 50 }));
            let gameStatus = await lottery.getGameStatus();
            assert.equal(gameStatus, false);
        });
    });

    describe('Play Lottery', function () {
        it('Should allow Player to play lottery', async function () {
            await lottery.startLottery(10, 100, { value: 100 });
            await lottery.playLottery({value: 100, from: accounts[1]});
            let [tickets, availableTickets, ticketPrice, gameStatus, winningAmount] = await lottery.getLotteryStatus();
            assert.equal(tickets, 10);
            assert.equal(ticketPrice, 100);
            assert.equal(availableTickets, 8);
            assert.equal(gameStatus, true);
            assert.isAtLeast(winningAmount, (tickets - availableTickets) * ticketPrice);
        });
        it('Should not allow Player to play lottery with out sending correct ticket price', async function () {
            await lottery.startLottery(10, 100, { value: 100 });
            await expectThrow(lottery.playLottery({value: 99, from: accounts[1]}));
            let [tickets, availableTickets, ticketPrice, gameStatus, winningAmount] = await lottery.getLotteryStatus();
            assert.equal(tickets, 10);
            assert.equal(ticketPrice, 100);
            assert.equal(availableTickets, 9);
            assert.equal(gameStatus, true);
            assert.isAtLeast(winningAmount, (tickets - availableTickets) * ticketPrice);
        });
        it('Should not allow same Player to buy multiple tickets', async function () {
            await lottery.startLottery(10, 100, { value: 100 });
            await lottery.playLottery({value: 100, from: accounts[1]})
            await expectThrow(lottery.playLottery({value: 100, from: accounts[1]}));
            let [tickets, availableTickets, ticketPrice, gameStatus, winningAmount] = await lottery.getLotteryStatus();
            assert.equal(tickets, 10);
            assert.equal(ticketPrice, 100);
            assert.equal(availableTickets, 8);
            assert.equal(gameStatus, true);
            assert.isAtLeast(winningAmount, (tickets - availableTickets) * ticketPrice);
        });
        it('Should not allow owner to buy multiple tickets', async function () {
            await lottery.startLottery(10, 100, { value: 100 });
            await expectThrow(lottery.playLottery({value: 100}));
            let [tickets, availableTickets, ticketPrice, gameStatus, winningAmount] = await lottery.getLotteryStatus();
            assert.equal(tickets, 10);
            assert.equal(ticketPrice, 100);
            assert.equal(availableTickets, 9);
            assert.equal(gameStatus, true);
            assert.isAtLeast(winningAmount, (tickets - availableTickets) * ticketPrice);
        });
        it('Should end the game when tickets are sold out', async function () {
            await lottery.startLottery(2, 100, { value: 100 });
            await lottery.playLottery({value: 100, from: accounts[1]});
            let [tickets, availableTickets, ticketPrice, gameStatus, winningAmount] = await lottery.getLotteryStatus();
            assert.equal(tickets, 2);
            assert.equal(ticketPrice, 100);
            assert.equal(availableTickets, 0);
            assert.equal(gameStatus, false);
            assert.isAtLeast(winningAmount, (tickets - availableTickets) * ticketPrice);
        });
        it('Should not allow players to buy tickets when game is ended', async function () {
            await lottery.startLottery(2, 100, { value: 100 });
            await lottery.playLottery({value: 100, from: accounts[1]});
            await expectThrow(lottery.playLottery({ value: 100, from: accounts[2] }));
            let [tickets, availableTickets, ticketPrice, gameStatus, winningAmount] = await lottery.getLotteryStatus();
            assert.equal(tickets, 2);
            assert.equal(ticketPrice, 100);
            assert.equal(availableTickets, 0);
            assert.equal(gameStatus, false);
            assert.isAtLeast(winningAmount, (tickets - availableTickets) * ticketPrice);
        });
    });
});
