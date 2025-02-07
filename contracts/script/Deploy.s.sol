// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Token} from "../src/Token.sol";
import {TreeDetector} from "../src/TreeDetector.sol";
import {Script} from "../lib/forge-std/src/Script.sol";

contract Deploy is Script {
    function run() external returns (Token, TreeDetector) {
        // These values should be replaced with your actual values
        address taskIssuerAddress = vm.envAddress("TASK_ISSUER_ADDRESS");
        bytes32 machineHash = vm.envBytes32("MACHINE_HASH");

        vm.startBroadcast();
        Token token = new Token("Carbon", "CBN");
        TreeDetector treeDetector = new TreeDetector(taskIssuerAddress, machineHash);
        vm.stopBroadcast();

        return (token, treeDetector);
    }
}
