# Throttled Background Queue for Outbound Delivery

Direct mass email blasting triggers spam filters and provider rate-limit suspensions. We decided to dispatch all bulk campaign emails through an asynchronous background worker queue with configurable per-sender drip intervals (e.g. 30–90 seconds) and daily sending caps, rather than unthrottled concurrent dispatch.
