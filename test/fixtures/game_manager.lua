-- 跨文件调用示例：GameManager 调用 Player 的方法
local Player = require("player")
local BattleSystem = require("battle_system")

local GameManager = class("GameManager")

function GameManager:ctor()
    self.player = Player.new(1)
    self.battle = BattleSystem.new()
end

function GameManager:StartGame()
    self.player:Heal(100)
    self.battle:BeginCombat(self.player)
end

function GameManager:OnPlayerDeath(killer)
    print("Game Over")
    self.battle:EndCombat()
end

function GameManager:Restart()
    self.player = Player.new(1)
    self:StartGame()
end

return GameManager