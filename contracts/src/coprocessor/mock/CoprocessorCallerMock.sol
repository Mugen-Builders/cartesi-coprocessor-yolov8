// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {ICoprocessorCallback, ICoprocessorOutputs} from "../ICoprocessorCallback.sol";
import {ICoprocessor} from "../ICoprocessor.sol";
import {LibError} from "../library/LibError.sol";

contract CoprocessorCallerMock is ICoprocessorCallback {
    using LibError for bytes;

    ICoprocessor public coprocessor;
    bytes32 public machineHash;

    mapping(bytes32 => bool) public computationSent;

    event ResultReceived(bytes output);

    error InvalidOutput();

    constructor(
        address _coprocessorAddress,
        bytes32 _machineHash
    ) {
        coprocessor = ICoprocessor(_coprocessorAddress);
        machineHash = _machineHash;
    }

    function callCoprocessor(bytes calldata input) external {
        bytes32 inputHash = keccak256(input);

        computationSent[inputHash] = true;

        // coprocessor.issueTask(machineHash, input, address(this));
    }

    function handleNotice(bytes calldata notice) public {
        bytes memory payload = abi.decode(notice, (bytes));

        address destination;
        bytes memory decodedPayload;

        (destination, decodedPayload) = abi.decode(payload, (address, bytes));

        bool success;
        bytes memory returndata;

        (success, returndata) = destination.call(decodedPayload);

        if (!success) {
            returndata.raise();
        }

        emit ResultReceived(decodedPayload);
    }

    function coprocessorCallbackOutputsOnly(
        bytes32 _machineHash,
        bytes32 _payloadHash,
        bytes[] calldata outputs
    ) external override {

        // require(msg.sender == address(coprocessor), "Unauthorized caller");

        require(_machineHash == machineHash, "Machine hash mismatch");

        // require(computationSent[_payloadHash] == true, "Computation not found");

        for (uint256 i = 0; i < outputs.length; i++) {
            bytes calldata output = outputs[i];

            require(output.length > 3, "Too short output");
            bytes4 selector = bytes4(output[:4]);
            bytes calldata arguments = output[4:];

            require(selector == ICoprocessorOutputs.Notice.selector);

            handleNotice(arguments);
        }
        // delete computationSent[_payloadHash];
    }
}
