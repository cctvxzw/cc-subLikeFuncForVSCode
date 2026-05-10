-- 模块模式：M = {}
local M = {}

function M:Init()
    self.data = {}
end

function M:RegisterEvent(evt, cb)
    self.data[evt] = cb
end

function M:UnregisterEvent(evt)
    self.data[evt] = nil
end

function M.FireEvent(evt, ...)
    print("fire event", evt)
end

local function privateHelper(a, b)
    return a + b
end

function globalHelper(msg)
    print("[Helper] " .. msg)
end

return M