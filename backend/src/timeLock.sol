// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TimelockSavings {

    struct Vault {
        uint256 amount;
        uint256 unlockTime;
        bool active;
    }

    mapping(address => Vault) public vaults;
    uint256 public totalActiveVaults;
    
    // Reward token
    IERC20 public rewardToken;
    uint256 public constant REWARD_RATE = 100; // 1 ETH = 100 tokens
    
    event Deposited(address user, uint256 amount, uint256 unlockTime, uint256 rewards);
    event Withdrawn(address user, uint256 amount);
    event RewardsClaimed(address user, uint256 amount);

    constructor(address _rewardToken) {
        rewardToken = IERC20(_rewardToken);
    }

    function deposit(uint256 unlockTime) external payable {
        require(msg.value > 0, "Send ETH");
        require(!vaults[msg.sender].active, "Vault active");

        // Calculate rewards (1 ETH = 100 tokens)
        uint256 rewardAmount = (msg.value * REWARD_RATE) / 1 ether;

        vaults[msg.sender] = Vault({
            amount: msg.value,
            unlockTime: unlockTime,
            active: true
        });

        totalActiveVaults++;

        // Transfer reward tokens to user
        if (rewardAmount > 0) {
            require(rewardToken.transfer(msg.sender, rewardAmount), "Reward transfer failed");
        }

        emit Deposited(msg.sender, msg.value, unlockTime, rewardAmount);
    }

    function withdraw() external {

        Vault storage v = vaults[msg.sender];

        require(v.active, "No vault");
        require(block.timestamp >= v.unlockTime, "Too early");

        uint256 amount = v.amount;

        v.amount = 0;
        v.active = false;

        totalActiveVaults--;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function getVault(address user)
        external
        view
        returns (uint256 amount, uint256 unlockTime, bool active)
    {
        Vault memory v = vaults[user];
        return (v.amount, v.unlockTime, v.active);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
