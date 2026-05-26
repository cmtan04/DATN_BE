import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthRepository {
  @InjectRepository(TBUserDefault)
  private readonly user: Repository<TBUserDefault>;

  @InjectRepository(TBUserProfile)
  private readonly userProfile: Repository<TBUserProfile>;

  public findByEmail = async (email: string): Promise<TBUserDefault | null> => {
    return await this.user.findOne({ where: { email } });
  };

  public findById = async (id: number): Promise<TBUserDefault | null> => {
    return await this.user.findOne({ where: { id } });
  };

  public createUser = async (
    userData: Partial<TBUserDefault>,
    profileData: Partial<TBUserProfile>,
  ): Promise<TBUserDefault> => {
    const userProfile = this.userProfile.create(profileData);
    const savedUserProfile = await this.userProfile.save(userProfile);

    const user = this.user.create({
      ...userData,
      userProfileId: savedUserProfile.id,
    });

    return await this.user.save(user);
  };
}
