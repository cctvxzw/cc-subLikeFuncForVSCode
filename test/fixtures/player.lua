-- 典型的 tolua 类定义 + 方法
local Player = class("Player", BaseEntity)

function Player:ctor(id)
    self.id = id
    self.hp = 100
    self.mp = 50
end

function Player:TakeDamage(damage, source)
    self.hp = self.hp - damage
    if self.hp <= 0 then
        self:OnDeath(source)
    end
end

function Player:Heal(amount)
    self.hp = math.min(self.hp + amount, 100)
end

function Player.GetMaxLevel()
    return 99
end

function Player:OnDeath(killer)
    print("Player " .. self.id .. " died")
end

return Player