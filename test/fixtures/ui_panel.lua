-- tolua C# 绑定调用场景
local UIPanel = class("UIPanel")

function UIPanel:ctor()
    self.gameObject = UnityEngine.GameObject("UIPanel")
    self.transform = self.gameObject.transform
end

function UIPanel:Awake()
    local btn = self.transform:Find("Button")
    local btnComp = btn:GetComponent(typeof(UnityEngine.UI.Button))
    btnComp.onClick:AddListener(function()
        self:OnClick()
    end)
end

function UIPanel:OnClick()
    print("button clicked")
    self:Close()
end

function UIPanel:Close()
    UnityEngine.Object.Destroy(self.gameObject)
end

return UIPanel