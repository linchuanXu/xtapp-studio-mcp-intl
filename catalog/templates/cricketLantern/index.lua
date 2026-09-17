-- 《灯下促织》：独立游戏组合根。

local Story = require("domain.story_cricket")
local VN = require("domain.vn_runtime")

local App = VN.create({
  story = Story,
  state_key = "cricket_lantern",
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
