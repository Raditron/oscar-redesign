import type { Collection, Db } from 'mongodb';
import type { Event } from '../../domain/events/event.ts';
import type { EventRepository } from '../../domain/events/event-repository.ts';
import { toEvent, toEventDocument, type EventDocument } from './event-document.ts';

/**
 * Adapter: the EventRepository, kept in MongoDB's `events` collection, one document per Event. It speaks documents
 * to MongoDB and Events to everyone else; event-document.ts translates between the two.
 */
export class MongoEventRepository implements EventRepository {
  private readonly collection: Collection<EventDocument>;

  constructor(db: Db) {
    this.collection = db.collection<EventDocument>('events');
  }

  async findAll(): Promise<Event[]> {
    const documents = await this.collection.find().toArray();
    return documents.map(toEvent);
  }

  async findById(id: string): Promise<Event | undefined> {
    const document = await this.collection.findOne({ _id: id });
    return document === null ? undefined : toEvent(document);
  }

  async save(event: Event): Promise<void> {
    await this.collection.replaceOne({ _id: event.id }, toEventDocument(event), { upsert: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
}
