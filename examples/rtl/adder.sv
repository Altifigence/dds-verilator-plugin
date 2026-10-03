// SPDX-FileCopyrightText: 2026 Altifigence
// SPDX-License-Identifier: Apache-2.0
`include "config.svh"
module adder (
  input logic [`WIDTH-1:0] a,
  input logic [`WIDTH-1:0] b,
  output logic [`WIDTH:0] sum
);
  assign sum = {1'b0, a} + {1'b0, b};
endmodule
