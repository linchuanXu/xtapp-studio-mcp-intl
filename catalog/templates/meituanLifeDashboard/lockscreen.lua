local Dashboard = require("dashboard_common")

function on_tick(ctx)
  ctx.lock:set_interval(60)
end

function on_draw(ctx, g)
  Dashboard.draw(ctx, g, false)
  ctx.lock:flush_once("partial")
end
