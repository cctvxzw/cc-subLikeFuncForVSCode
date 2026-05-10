-- 跨文件调用示例：BattleSystem 调用 Player 的方法
local UIPanel = require("ui_panel")

local BattleSystem = class("BattleSystem")

function BattleSystem:ctor()
    self.enemyHp = 100
    self.inCombat = false
    self.ui = UIPanel.new()
end

function BattleSystem:BeginCombat(player)
    self.inCombat = true
    player:TakeDamage(10, "Enemy")
    self.ui:Awake()
end

function BattleSystem:EndCombat()
    self.inCombat = false
    self.enemyHp = 100
end

function BattleSystem:ProcessRound(player)
    if not self.inCombat then
        return
    end
    player:TakeDamage(5, "Enemy")
    self.enemyHp = self.enemyHp - 20
end

return BattleSystem