-- 文游基座 Demo：组合根。换剧本只改本文件的 Story require + create 参数。

local Story = require("domain.story_demo")
local VN = require("domain.vn_runtime")

local App = VN.create({
  story = Story,
  state_key = "webgal_kit",
})

function on_load(ctx)
  ctx:set_tick_rate("idle")
end

function on_enter(ctx)
  App.boot(ctx)
  ctx:invalidate()
end

function on_input(ctx, ev)
  return App.on_input(ctx, ev)
end

function on_draw(ctx, g)
  App.on_draw(ctx, g)
end
