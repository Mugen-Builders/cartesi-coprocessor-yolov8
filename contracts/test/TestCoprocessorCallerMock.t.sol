//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Token} from "../src/Token.sol";
import {Test, console} from "forge-std/Test.sol";
import {TreeDetector} from "../src/TreeDetector.sol";
import {TaskIssuerMock} from "./mock/TaskIssuerMock.sol";

contract TestTreeDetector is Test {
    address user = vm.addr(4);

    bytes32 machineHash = bytes32("0x1235");
    bytes32 imageHash = bytes32("0x1234");

    Token token;
    TreeDetector treeDetector;
    TaskIssuerMock taskIssuerMock;

    function setUp() public {
        token = new Token("Test Token", "TTK");
        taskIssuerMock = new TaskIssuerMock();
        treeDetector = new TreeDetector(address(taskIssuerMock), machineHash);
    }

    function testCallTreeDetectorWithAValidInput() public {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/test/input.json");
        string memory rawInput = vm.readFile(path);
        bytes memory input = bytes(rawInput);

        bytes memory payload = abi.encode(user, input);
        console.logBytes(payload);

        vm.expectEmit();
        emit TaskIssuerMock.TaskIssued(machineHash, payload, address(treeDetector));

        vm.prank(user);
        treeDetector.runExecution(input);

        bytes memory encodedTx = abi.encodeWithSignature("mint(address,uint256)", user, 5);

        bytes memory abiCall = abi.encode(address(token), encodedTx);

        bytes memory output = abi.encode(imageHash, abiCall);

        bytes memory notice = abi.encodeWithSignature("Notice(bytes)", output);

        bytes[] memory outputs = new bytes[](1);
        outputs[0] = notice;

        vm.expectEmit();
        emit TreeDetector.ResultReceived(keccak256(payload), imageHash);

        vm.prank(address(taskIssuerMock));
        treeDetector.coprocessorCallbackOutputsOnly(machineHash, keccak256(payload), outputs);

        uint256 balance = token.balanceOf(user);
        assertEq(balance, 5);
    }
}
