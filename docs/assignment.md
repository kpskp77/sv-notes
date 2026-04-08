# Assignment

SV有三种形式的assignment：

- continuous assignment
- procedural assignment
- procedural continuous assignment

## Continuous Assignment
通过关键字`assign`进行的赋值操作。
```sv
assign [ drive_strength ] [ delay ] a = b ;
```

- net和variable都可以使用continuous assignment赋值
- continuous assignment的delay模拟的是惯性时延（inertial-delay，存在分布式电容，驱动有惯性，**可以过滤掉毛刺**），假如驱动源在delay期间再次发生变化（即，当前已规划的驱动值还未来得及传输到目的端，驱动源的值再次发生变化），则：
    - 计算右边表达式的新值
    - 如果新值和当前已经规划的驱动值不同，取消原有规划的驱动event
    - 如果新值和当前左边目标值相同，不规划任何event
    - 如果新值和当前左边目标值不同，以当前时刻的状态重新计算delay值，并规划新的event
- 如果net声明中包含delay，但是不包含等号赋值，表示所有对该net的驱动都需要经过相应的delay后才能生效。例如 `wire #3 a;`
表示所有对a的驱动需要三个时间单位 delay后生效。
- 如果net声明中同时包含delay和等号赋值，则该delay仅应用于implicit continuous assignment单个驱动源，在其他对该net的continuous assignment中不生效。
- continuous assignment不支持intra-assignment delay

```sv
module test;
  wire a;
  reg  b;
  initial begin
    $monitor("a=%0d, b=%0d, @%0t", a, b, $time);
    #10 $finish();
  end
  initial begin
    #1 b = 1'b1; // @1
    #3 b = 1'bx; // @4, will be ignored
    #1 b = 1'b1; // @5
    #1 b = 1'b0; // @6,  will be ignored
    #1 b = 1'bx; // @7
  end
  assign #2 a = b;
endmodule
```
```none title="output"
a=x, b=x, @0
a=x, b=1, @1
a=1, b=1, @3
a=1, b=x, @4
a=1, b=1, @5
a=1, b=0, @6
a=1, b=x, @7
a=x, b=x, @9
```

b在@4和@6时刻的变化还未来得及传输到a，分别在@5和@7被新的变化取代。

## Procedural Assignment
在`always`和`initial`块中进行的赋值操作。只有variable可以使用procedural assignment，分为blocking assignment和non-blocking assignment两大类。non-blocking assignment不阻塞当前进程，等号两边表达式在当前time slot的active（或re-active）event region执行，赋值操作在NBA（或re-NBA）event region执行。

### intra-assignment delay
在Procedural Assignment的等号右边添加delay：

```sv
a  = #dly b;
a <= #dly b;
```

- 对于blocking assignment，阻塞当前进程。等号右边表达式在当前时刻执行，等号左边表达式以及赋值操作在dly唤醒后执行。
- 对于non-blocking assignment，不阻塞当前进程。等号两边表达式在当前时刻执行，但是将赋值操作规划到dly之后。

*Example 1*:
```sv
module test;
  int idx;
  int data[4];
  initial
  begin
    idx = 0;
    fork
      #1 idx = 1;
      data[idx]  = #2 1; // assign to data[1]
      data[idx] <= #2 2; // assign to data[0]
    join
    #1 $finish;
  end
  initial $monitor("data[0]=%0d,data[1]=%0d,data[2]=%0d,data[3]=%0d,@%0t",
    data[0],data[1],data[2],data[3],$time);
endmodule
```
```none title="output"
data[0]=0,data[1]=0,data[2]=0,data[3]=0,@0
data[0]=2,data[1]=1,data[2]=0,data[3]=0,@2
```

*Example 2*:
```sv
module nonblock1;
  logic a, b, c, d, e, f;
  // blocking assignments
  initial begin
    a = #10 1; // a will be assigned 1 at time 10
    b = #2 0; // b will be assigned 0 at time 12
    c = #4 1; // c will be assigned 1 at time 16
  end
  // nonblocking assignments
  initial begin
    d <= #10 1; // d will be assigned 1 at time 10
    e <= #2 0; // e will be assigned 0 at time 2
    f <= #4 1; // f will be assigned 1 at time 4
  end
endmodule
```

*Example 3*:
```sv
module multiple2;
  logic a;
  initial a = 1;
  initial a <= #4 0; // schedules 0 at time 4
  initial a <= #4 1; // schedules 1 at time 4
  // At time 4, a = ??
  // The assigned value of the variable is indeterminate
endmodule
```

*Example 4*:
```sv
module multiple3;
  logic a;
  initial #8 a <= #8 1; // executed at time 8;
  // schedules an update of 1 at time 16
  initial #12 a <= #4 0; // executed at time 12;
  // schedules an update of 0 at time 16
  // Because it is determinate that the update of a to the value 1
  // is scheduled before the update of a to the value 0,
  // then it is determinate that a will have the value 0
  // at the end of time slot 16.
endmodule
```

## Procedural Continuous Assignment

## Assign vs. Always

```sv
module test;
  logic r, a, b, c, d, e;

  initial begin
    #1 r = 1'b1; // @1
    #3 r = 1'b0; // @4
    #1 r = 1'bx; // @5
  end
  initial #10 $finish;

  assign #2 a = r;
  always @(r) b  = #2 r;
  always @(r) c <= #2 r;
  always @(r) #2 d  = r;
  always @(r) #2 e <= r;
endmodule
```

![assign vs always时序图](assets/images/assign-vs-always-example.png)

r在@1和@4的变化之间隔了3个时间单位，满足#2的时延要求，a/b/c/d/e均在@3由x变为1。r在@4和@5的变化之间只有一个时间单位，不满足#2的时延要求，a/b/c/d/e表现不尽相同：

- 对于a，assign delay是惯性时延，r@4的变化被忽略
- 对于b，intra-assignment delay使用delay前的值，r@5的变化没有触发新的event，因为此时线程被阻塞中
- 对于c，intra-assignment delay使用delay前的值，并且non-blocking assignment不会 阻塞线程，r@5的变化也会触发新的event
- 对d和e，r@4的变化触发event之后，两个赋值语句均被规划到2个时间单位之后执行，r@5的变化时，两个线程被阻塞中，无法触发新的event；@6线程恢复，赋值使用当前时刻值x
