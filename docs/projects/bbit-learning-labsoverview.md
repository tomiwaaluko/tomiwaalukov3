# BBIT Learning Labs — Market Watch Lab Overview

`tech_lab_on_campus/market_watch`

---

## Project Purpose

Market Watch is a Bloomberg BBIT on-campus paired-programming lab that teaches RabbitMQ messaging patterns through a simulated stock price distribution system. Students implement producer and consumer classes against Bloomberg-defined interfaces, then test them by passing real-time stock data through a RabbitMQ broker running in Docker.

The lab progresses across two units: a direct exchange (one producer to one consumer) and a topic exchange (routing messages to sector-specific queues using wildcard binding keys).

---

## Tech Stack

| Technology | Role |
|---|---|
| **Python 3** | Implementation language |
| **pika** | RabbitMQ AMQP client library |
| **RabbitMQ 3** (`rabbitmq:3-management`) | Message broker; management UI on port 15672 |
| **Docker / Docker Compose** | Containerized lab environment |
| **Jupyter Lab** | Interactive notebook server (port 8888) |
| `jupyter/scipy-notebook` | Base Docker image for the `rmq_lab` container |

Dependencies (`tech_lab_build/requirements.txt`): `pika` only — the base image provides everything else.

---

## Directory Structure

```
tech_lab_on_campus/market_watch/
├── docker-compose.yaml               # Two services: rabbitmq + rmq_lab
├── tech_lab_build/
│   ├── Dockerfile                    # jupyter/scipy-notebook + pika
│   └── requirements.txt              # pika
├── producer_and_consumer/            # Unit 1: direct exchange (paired)
│   ├── producer/
│   │   ├── producer_interface.py     # Interface stub
│   │   ├── publish.py                # Runs the producer
│   │   └── solution/                 # Student solution goes here
│   └── consumer/
│       ├── consumer_interface.py     # Interface stub
│       ├── consume.py                # Runs the consumer
│       └── solution/
│           └── consumer_sol.py       # Reference solution
├── topic_exchange/                   # Unit 2: topic exchange (paired)
│   ├── producer_interface.py
│   ├── consumer_interface.py
│   ├── publish.py                    # CLI: ticker, price, sector
│   ├── consume.py                    # CLI: sector, queueName
│   └── solution/                     # Student solution goes here
└── resources/
    ├── RabbitMQ.md                   # Exchange concepts + pika code samples
    ├── Functions.md                  # pika API reference for the lab
    ├── Finance.md                    # Basic financial concepts (tickers, sectors)
    ├── Python-Basics.md              # sys/argparse command-line reading
    └── Git-Commands.md               # Git workflow reference
```

---

## Infrastructure

### `docker-compose.yaml`

Two services:

| Service | Image | Ports | Notes |
|---|---|---|---|
| `rabbitmq` | `rabbitmq:3-management` | 30424 (AMQP), 15672 (UI) | `VHOST=rmq-docker-broker` |
| `rmq_lab` | built from `tech_lab_build/` | 8888 (Jupyter) | `AMQP_URL` env var; mounts `./` to `/app` |

The `rmq_lab` Dockerfile sets `PYTHONPATH=/app/consumer:/app/producer:/app/market_watch` so student scripts can import interface and solution modules without relative path hacks.

---

## Interface / Implementation Pattern

Both units define interface files with `pass` bodies. Students subclass them and place their implementations in the `solution/` directory.

### `mqProducerInterface` (`producer_interface.py`)

```python
class mqProducerInterface:
    def __init__(self, routing_key: str, exchange_name: str) -> None: pass
    def setupRMQConnection(self) -> None: pass   # connect, channel, exchange_declare
    def publishOrder(self, message: str) -> None: pass  # basic_publish, close
```

### `mqConsumerInterface` (`consumer_interface.py`)

```python
class mqConsumerInterface:
    def __init__(self, binding_key: str, exchange_name: str, queue_name: str) -> None: pass
    def setupRMQConnection(self) -> None: pass   # connect, channel, queue_declare, exchange_declare, queue_bind, basic_consume
    def on_message_callback(self, channel, method_frame, header_frame, body) -> None: pass  # ack + print
    def startConsuming(self) -> None: pass       # start_consuming loop
    def __del__(self) -> None: pass              # close channel + connection
```

### Reference Solution (`consumer_sol.py`)

The full consumer implementation uses `pika.URLParameters(os.environ["AMQP_URL"])` to connect, declares both the queue and exchange, binds with the binding key, and uses `basic_ack` + `start_consuming` for the message loop.

---

## Unit 1: Producer and Consumer (Direct Exchange)

**Pattern**: Direct exchange — message delivered to the queue whose binding key exactly matches the producer's routing key.

**Workflow**: Paired programming. Partner A implements the producer, Partner B implements the consumer. Both push to the same forked repo and pull each other's work before running the combined solution.

**Service files** (pre-written, import from `solution/`):

- `publish.py` — creates `mqProducer(routing_key="Tech Lab Key", exchange_name="Tech Lab Exchange")`, publishes `"Success! Producer And Consumer Section Complete."`
- `consume.py` — creates `mqConsumer(binding_key="Tech Lab Key", exchange_name="Tech Lab Exchange", queue_name="Tech Lab Queue")`, starts consuming

**Testing**: Run `consume.py` in one terminal, `publish.py` in another. The consumer terminal should print the success message.

---

## Unit 2: Topic Exchange

**Pattern**: Topic exchange — messages routed by dot-separated routing keys (e.g. `Stock.TSLA.tech`). Consumers bind with wildcard patterns using `*` (exactly one word) or `#` (zero or more words).

**Student tasks**:

- **Producer**: Read `ticker`, `price`, `sector` from CLI → build a routing key → publish message like `"TSLA is $182.34"` to `"Tech Lab Topic Exchange"`
- **Consumer**: Read `sector` and `queueName` from CLI → build a wildcard binding key → consume from the named queue on `"Tech Lab Topic Exchange"`

**Testing**: Three terminals — two consumers (one subscribing to tech, one to healthcare) and one producer. Send a tech stock, a health stock, and an unrelated sector. Verify each message routes only to the correct queue.

**Stretch goal**: Create multiple bindings on a single queue to subscribe to multiple sectors simultaneously.

---

## Setup

### Option 1: GitHub Codespaces (Recommended)

```sh
# From the codespace terminal:
cd tech_lab_on_campus/market_watch
docker-compose up
# Open port 15672 from the Ports tab → RabbitMQ UI (guest / guest)
```

### Option 2: Local Docker

```sh
cd bbit-learning-labs/tech_lab_on_campus/market_watch

# Verify Docker is running
docker -v && docker-compose -v

# IDE mode (bash into container)
docker-compose up -d && docker-compose exec rmq_lab /bin/bash

# OR Jupyter mode
docker-compose up
# Open the Jupyter URL printed in terminal (port 8888)
```

RabbitMQ Management UI: `http://localhost:15672` — login `guest` / `guest`

---

## Resume Bullet Points

- Selected as 1 of 30 students for Bloomberg's on-campus BBIT coding lab; implemented RabbitMQ producer/consumer classes in Python against Bloomberg-defined interface contracts in a Docker-based Jupyter environment.
- Built a stock price distribution system using RabbitMQ direct and topic exchanges, routing live market data (ticker, price, sector) to sector-specific consumer queues via dot-separated routing keys and wildcard binding patterns.
- Collaborated in a paired-programming workflow using Git and GitHub to integrate partner implementations across producer and consumer services, completing both the direct exchange and topic exchange units end-to-end.
