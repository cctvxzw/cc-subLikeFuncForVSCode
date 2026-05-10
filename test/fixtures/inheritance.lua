-- 多层继承和边缘写法
local Animal = class("Animal")

function Animal:ctor(name)
    self.name = name
end

function Animal:Speak()
    print("...")
end

local Dog = class("Dog", Animal)

function Dog:ctor(name, breed)
    self.base.ctor(self, name)
    self.breed = breed
end

function Dog:Speak()
    print("Woof!")
end

-- 基类无参数 class
local EmptyBase = class("EmptyBase")

function EmptyBase:Foo()
end

return Dog