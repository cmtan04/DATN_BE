import { Column, Entity } from 'typeorm';

@Entity('tb_location_availability')
export class TBLocationAvailability {
  @Column()
  locationId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int', default: 0 })
  bookedCount: number;
}
