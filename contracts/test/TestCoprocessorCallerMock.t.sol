//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {CoprocessorCallerMock} from "../src/coprocessor/mock/CoprocessorCallerMock.sol";
import {Token} from "../src/Token.sol";

contract TestCoprocessorCallerMock is Test {
    address caller = vm.addr(4);

    bytes32 machineHash = keccak256(abi.encodePacked("machineHash"));
    bytes32 payloadHash = keccak256(abi.encodePacked("payloadHash"));

    Token token;
    CoprocessorCallerMock coprocessorCallerMock;

    function setUp() public {
        token = new Token("Test Token", "TTK");
        coprocessorCallerMock = new CoprocessorCallerMock(
            address(1),
            address(2),
            address(3),
            machineHash
        );
    }

    function testCallCoprocessorCallerMock() public {
        bytes memory encoded_tx = abi.encodeWithSignature(
            "mint(address,uint256)",
            caller,
            5
        );

        bytes memory payload = abi.encode(address(token), encoded_tx);

        bytes memory notice = abi.encodeWithSignature("Notice(bytes)", payload);

        bytes[] memory outputs = new bytes[](1);
        outputs[0] = notice;

        coprocessorCallerMock.coprocessorCallbackOutputsOnly(
            machineHash,
            payloadHash,
            outputs
        );

        uint256 balance = token.balanceOf(caller);
        assertEq(balance, 5);
    }
}
