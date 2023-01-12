export declare enum EventType {
    Article = "article",
    Page = "page",
    Comment = "comment",
    Subscription = "subscription",
    Author = "author",
    Poll = "poll",
    User = "user"
}
export interface ActivityEvent {
    date: Date;
    eventType: EventType;
    id: string;
    creator?: string;
    summary?: string;
}
//# sourceMappingURL=activityEvent.d.ts.map