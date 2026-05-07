package com.aegis.aegis_server.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    // Exchange names
    public static final String EXCHANGE = "aegis.events";
    public static final String DLX_EXCHANGE = "aegis.dlx";

    // Queue names
    public static final String TELEMETRY_QUEUE = "aegis.telemetry.events";
    public static final String THREAT_QUEUE = "aegis.threat.alerts";
    public static final String SCORE_QUEUE = "aegis.score.updates";

    // DLQ names
    public static final String TELEMETRY_DLQ = "aegis.telemetry.events.dlq";
    public static final String THREAT_DLQ = "aegis.threat.alerts.dlq";
    public static final String SCORE_DLQ = "aegis.score.updates.dlq";

    // Routing keys
    public static final String TELEMETRY_ROUTING_KEY = "telemetry.#";
    public static final String THREAT_ROUTING_KEY = "threat.#";
    public static final String SCORE_ROUTING_KEY = "score.#";

    // ---- Exchanges ----

    @Bean
    public TopicExchange aegisExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public TopicExchange deadLetterExchange() {
        return new TopicExchange(DLX_EXCHANGE);
    }

    // ---- Queues ----

    @Bean
    public Queue telemetryQueue() {
        return QueueBuilder.durable(TELEMETRY_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .build();
    }

    @Bean
    public Queue threatQueue() {
        return QueueBuilder.durable(THREAT_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .build();
    }

    @Bean
    public Queue scoreQueue() {
        return QueueBuilder.durable(SCORE_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .build();
    }

    // ---- Dead Letter Queues ----

    @Bean
    public Queue telemetryDLQ() {
        return QueueBuilder.durable(TELEMETRY_DLQ).build();
    }

    @Bean
    public Queue threatDLQ() {
        return QueueBuilder.durable(THREAT_DLQ).build();
    }

    @Bean
    public Queue scoreDLQ() {
        return QueueBuilder.durable(SCORE_DLQ).build();
    }

    // ---- Bindings ----

    @Bean
    public Binding telemetryBinding(Queue telemetryQueue, TopicExchange aegisExchange) {
        return BindingBuilder.bind(telemetryQueue).to(aegisExchange).with(TELEMETRY_ROUTING_KEY);
    }

    @Bean
    public Binding threatBinding(Queue threatQueue, TopicExchange aegisExchange) {
        return BindingBuilder.bind(threatQueue).to(aegisExchange).with(THREAT_ROUTING_KEY);
    }

    @Bean
    public Binding scoreBinding(Queue scoreQueue, TopicExchange aegisExchange) {
        return BindingBuilder.bind(scoreQueue).to(aegisExchange).with(SCORE_ROUTING_KEY);
    }

    // ---- DLQ Bindings ----

    @Bean
    public Binding telemetryDlqBinding(Queue telemetryDLQ, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(telemetryDLQ).to(deadLetterExchange).with(TELEMETRY_ROUTING_KEY);
    }

    @Bean
    public Binding threatDlqBinding(Queue threatDLQ, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(threatDLQ).to(deadLetterExchange).with(THREAT_ROUTING_KEY);
    }

    @Bean
    public Binding scoreDlqBinding(Queue scoreDLQ, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(scoreDLQ).to(deadLetterExchange).with(SCORE_ROUTING_KEY);
    }

    // ---- Message Converter ----

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
