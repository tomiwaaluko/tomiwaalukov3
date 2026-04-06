# BBIT Learning Labs — Market Watch (RabbitMQ Module)

## Overview
Bloomberg educational learning module that teaches RabbitMQ messaging architecture, Python OOP concepts, and financial domain knowledge through hands-on lab exercises. Focuses on producer-consumer patterns and message queue systems, delivered via Docker and Jupyter Notebook.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3 |
| Messaging | RabbitMQ (via `pika` library) |
| Containerization | Docker + Docker Compose |
| Testing | pytest + ipytest |
| Data Visualization | bqplot (Jupyter charts) |
| Numerical Computing | numpy |
| Environment | Jupyter Notebook |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Developer Environment                     │
│             (Docker Compose / GitHub Codespaces)            │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐
│    Producer     │               │    Consumer     │
│  (publish.py)   │               │  (consume.py)   │
│                 │               │                 │
│  mqProducer     │               │  mqConsumer     │
│  ├ __init__()   │               │  ├ __init__()   │
│  ├ setupRMQ     │               │  ├ setupRMQ     │
│  │ Connection() │               │  │ Connection() │
│  └ publishOrder │               │  ├ on_message   │
│    ()           │               │  │ _callback()  │
└────────┬────────┘               │  ├ startConsum  │
         │                        │  │ ing()        │
         │  AMQP (port 5672)      │  └ __del__()    │
         ▼                        └────────┬────────┘
┌────────────────────────────────────────────────────┐
│                   RabbitMQ Broker                  │
│                                                    │
│  Exchange: "Tech Lab Exchange" (topic)             │
│  Routing Key: "Tech Lab Key"                       │
│  Queue: named per consumer instance                │
│                                                    │
│  Management UI → port 15672                        │
│  AMQP protocol → port 5672                         │
└────────────────────────────────────────────────────┘
         ▲
         │ docker-compose up -d
┌────────┴───────────────────────────────────────────┐
│              docker-compose.yaml                   │
│  Service: rmq_lab                                  │
│  Ports: 5672:5672 (AMQP), 15672:15672 (UI)        │
└────────────────────────────────────────────────────┘
```

---

## Message Flow

```
1. Producer connects to RabbitMQ exchange
2. Producer publishes a message with a routing key
3. RabbitMQ routes message to the bound queue
4. Consumer receives message via on_message_callback()
5. Consumer processes and acknowledges the message
```

---

## Key Classes & Interfaces

### Producer Interface (`producer_interface.py`)
```python
class mqProducerInterface(ABC):
    @abstractmethod
    def setupRMQConnection(self): ...

    @abstractmethod
    def publishOrder(self, message: str): ...
```

### Consumer Interface (`consumer_interface.py`)
```python
class mqConsumerInterface(ABC):
    @abstractmethod
    def setupRMQConnection(self): ...

    @abstractmethod
    def on_message_callback(self, channel, method, properties, body): ...

    @abstractmethod
    def startConsuming(self): ...
```

---

## Project Structure

```
tech_lab_on_campus/market_watch/
├── README.md
├── docker-compose.yaml
├── producer_and_consumer/
│   ├── README.md
│   ├── producer/
│   │   ├── producer_interface.py     # Abstract interface
│   │   ├── publish.py                # Entry point
│   │   └── solution/
│   │       └── producer_sol.py       # Reference implementation
│   └── consumer/
│       ├── consumer_interface.py     # Abstract interface
│       ├── consume.py                # Entry point
│       └── solution/
│           └── consumer_sol.py       # Reference implementation
└── resources/
    ├── Finance.md
    ├── Functions.md
    ├── Git-Commands.md
    └── Python-Basics.md
```

---

## RabbitMQ Configuration

| Parameter | Value |
|---|---|
| Exchange | "Tech Lab Exchange" (topic type) |
| Routing Key | "Tech Lab Key" |
| Queue | Named per consumer instance |
| Management UI | http://localhost:15672 (guest/guest) |
| AMQP Port | 5672 |

---

## Getting Started

```bash
# Start RabbitMQ container
docker-compose up -d

# Enter the lab container
docker-compose exec rmq_lab /bin/bash

# Run producer
python producer_and_consumer/producer/publish.py

# Run consumer (separate terminal)
python producer_and_consumer/consumer/consume.py
```

**Alternatives:** GitHub Codespaces (cloud), local Docker installation

---

## Learning Objectives

| Topic | Concepts Covered |
|---|---|
| Python OOP | Classes, abstract interfaces, inheritance, `__del__` destructors |
| RabbitMQ | Exchanges, queues, routing keys, topic exchanges, AMQP protocol |
| Docker | Container orchestration, docker-compose, port mapping |
| Finance Domain | Tickers, market sectors, order types |
| Architecture | Message-driven architecture, producer-consumer pattern, async messaging |
