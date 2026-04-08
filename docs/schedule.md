# Scheduling Semantics

## event region

![SV仿真器任务调度流程图](/assets/images/scheduling-event-regions.png)

::: info IEEE Std 1800™-2023: Standard for SystemVerilog, 4.5 SystemVerilog simulation reference algorithm
``` c++
execute_simulation {
  T = 0;
  initialize the values of all nets and variables;
  schedule all initialization events into time 0 slot;
  while (some time slot is nonempty) {
    move to the first nonempty time slot and set T;
    execute_time_slot (T);
  }
}

execute_time_slot {
  execute_region (Preponed);
  execute_region (Pre-Active);
  while (any region in [Active ... Pre-Postponed] is nonempty) {
    while (any region in [Active ... Post-Observed] is nonempty) {
      execute_region (Active);
      R = first nonempty region in [Active ... Post-Observed];
      if (R is nonempty)
        move events in R to the Active region;
    }
    while (any region in [Reactive ... Post-Re-NBA] is nonempty) {
      execute_region (Reactive);
      R = first nonempty region in [Reactive ... Post-Re-NBA];
      if (R is nonempty)
        move events in R to the Reactive region;
    }
    if (all regions in [Active ... Post-Re-NBA] are empty)
      execute_region (Pre-Postponed);
  }
  execute_region (Postponed);
}

execute_region {
  while (region is nonempty) {
    E = any event from region;
    remove E from the region;
    if (E is an update event) {
      update the modified object;
      schedule evaluation event for any process sensitive to the object;
    } else { /* E is an evaluation event */
      evaluate the process associated with the event and possibly
      schedule further events for execution;
    }
  }
}
```
:::

真实硬件行为是并行的，仿真器将真实的硬件行为抽象成独立的仿真进程，各进程并发。SV进程分类：

| 进程 | 类型 | 行为 |
| :--- | :--- | :--- |
| initial 块 | 静态 | 在仿真时刻 0 启动执行，仅执行一次，多个 initial 之间无确定的先后执行顺序 |
| always 块 | 静态 | 整个仿真过程中始终运行 |
| assign 语句 | 静态 | 整个仿真过程中始终运行 |
| fork...join/join_any/join_none | 动态 | 动态创建和启动，仅执行一次 |

SV 的所有语句都是在上述四个进程之一中被执行，进程执行过程中可以被阻塞，等待满足触发条件后被重新唤醒。SV 调度器同时只会调度一个进程，某个进程除非被阻塞，否则不会被打断。**同一个仿真时刻有多个进程等待被调度时，多个进程被调度的先后关系是不确定的**。进程阻塞方式：

| 阻塞方式 | 唤醒条件 |
| :--- | :--- |
| `# dly` | `dly` 单位仿真时间之后 |
| `@ (XXX)` | 对应敏感条件被触发，敏感条件可以是信号，也可以是 event |
| `wait (expr)` | `expr` 表达式为 1 时 |

## RTL 时序逻辑仿真

![RTL D 触发器时序](/assets/images/scheduling-real-rtl.png)

真实 RTL 的触发器电路，时钟上升沿到来后，需要经过一段时延，输出端口 Q 的输出信号才会翻转，输入端口 D 端的输入需要满足 setup/hold time（即，提前时钟上升沿 setup time 到来，并持续到上升沿之后的 hold time 时间内保持稳定）。多级 D 触发器级联时，下一级的 D 端采样是上一级在上一拍的 Q 端输出。

![systemverilog 时序逻辑仿真](/assets/images/scheduling-simu-rtl.jpeg)

EDA 前端仿真不带任何时延，通过非阻塞赋值来模拟时序逻辑。时钟上升沿在 active event region 触发后，非阻塞赋值等号右边的表达式也在 active event region 执行，赋值操作在 NBA event region 执行。从而保证非阻塞赋值的采样值都是更新前的值（即上一拍的值），赋值更新后的值作用到一个时钟上升沿的采样，模拟了 D 触发器的采样和驱动逻辑。