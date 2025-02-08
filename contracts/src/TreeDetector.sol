// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LibError} from "./library/LibError.sol";
import {CoprocessorAdapter} from "../lib/coprocessor-base-contract/src/CoprocessorAdapter.sol";

contract TreeDetector is CoprocessorAdapter {
    using LibError for bytes;

    event ResultReceived(bytes32 payloadHash, bytes32 imageHash);

    constructor(address _taskIssuerAddress, bytes32 _machineHash)
        CoprocessorAdapter(_taskIssuerAddress, _machineHash)
    {}

    function runExecution(bytes calldata input) external {
        bytes memory data = abi.encode(msg.sender, input);
        this._callCoprocessor(data);
    }

    function _callCoprocessor(bytes calldata data) external {
        if (msg.sender != address(this)) {
            revert UnauthorizedCaller(msg.sender);
        }
        callCoprocessor(data);
    }

    function handleNotice(bytes32 payloadHash, bytes memory notice) internal override {
        bytes32 imageHash;
        bytes memory abiCall;
        (imageHash, abiCall) = abi.decode(notice, (bytes32, bytes));

        address destination;
        bytes memory encodedTx;
        (destination, encodedTx) = abi.decode(abiCall, (address, bytes));

        (bool success, bytes memory returndata) = destination.call(encodedTx);

        if (!success) {
            returndata.raise();
        }

        emit ResultReceived(payloadHash, imageHash);
    }
}
