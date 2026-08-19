/**
 * Snowflake ID structure (64 bits):
 * - 1 bit: Sign bit (always 0)
 * - 41 bits: Timestamp (milliseconds since custom epoch)
 * - 10 bits: Machine/Node ID
 * - 12 bits: Sequence number
 */

const EPOCH = 1640995200000; // Custom epoch: 2022-01-01 00:00:00 UTC
const NODE_ID_BITS = 10;
const SEQUENCE_BITS = 12;
const MAX_NODE_ID = (1 << NODE_ID_BITS) - 1;
const MAX_SEQUENCE = (1 << SEQUENCE_BITS) - 1;

class SnowflakeGenerator {
  private nodeId: number;
  private sequence: number = 0;
  private lastTimestamp: number = -1;

  constructor(nodeId: number = 1) {
    if (nodeId > MAX_NODE_ID || nodeId < 0) {
      throw new Error(`Node ID must be between 0 and ${MAX_NODE_ID}`);
    }
    this.nodeId = nodeId;
  }

  generate(): string {
    let timestamp = Date.now();

    if (timestamp < this.lastTimestamp) {
      throw new Error("Clock moved backwards. Refusing to generate ID");
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & MAX_SEQUENCE;
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    const timestampPart =
      BigInt(timestamp - EPOCH) << BigInt(NODE_ID_BITS + SEQUENCE_BITS);
    const nodeIdPart = BigInt(this.nodeId) << BigInt(SEQUENCE_BITS);
    const sequencePart = BigInt(this.sequence);

    const snowflakeId = timestampPart | nodeIdPart | sequencePart;

    return snowflakeId.toString();
  }

  private waitNextMillis(lastTimestamp: number): number {
    let timestamp = Date.now();
    while (timestamp <= lastTimestamp) {
      timestamp = Date.now();
    }
    return timestamp;
  }
}

const snowflakeGenerator = new SnowflakeGenerator();

export function generateSnowflakeId(): string {
  return snowflakeGenerator.generate();
}

export { SnowflakeGenerator };
