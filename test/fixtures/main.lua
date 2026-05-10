-- 入口文件：聚合跨文件调用
local GameManager = require("game_manager")
local M = require("module")

local gm = GameManager.new()
gm:StartGame()
gm:Restart()

M:Init()
M:RegisterEvent("on_click", function()
    print("clicked")
end)