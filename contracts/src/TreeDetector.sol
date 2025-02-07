// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LibError} from "./library/LibError.sol";
import {CoprocessorAdapter} from "../lib/coprocessor-base-contract/src/CoprocessorAdapter.sol";

contract TreeDetector is CoprocessorAdapter {
    using LibError for bytes;

    event ResultReceived(bytes32 payloadHash);

    constructor(address _taskIssuerAddress, bytes32 _machineHash)
        CoprocessorAdapter(_taskIssuerAddress, _machineHash)
    {}

    function runExecution(bytes calldata input) external {
        callCoprocessor(input);
    }

    function handleNotice(bytes32 payloadHash, bytes memory notice) internal override {
        address destination;
        bytes memory encodedTx;

        (destination, encodedTx) = abi.decode(notice, (address, bytes));

        bool success;
        bytes memory returndata;

        (success, returndata) = destination.call(encodedTx);

        if (!success) {
            returndata.raise();
        }

        emit ResultReceived(payloadHash);
    }
}
