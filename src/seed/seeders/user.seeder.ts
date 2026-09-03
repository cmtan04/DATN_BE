import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';

interface SeedUserData {
  email: string;
  userRole: number;
  status: number;
  isEmailVerified: boolean;
  isApplyingForOwner?: boolean;
  ownerRequestStatus: number;
  profile: {
    fullName: string;
    avatarUrl: string | null;
    phoneNumber: string;
  };
}

export const DEFAULT_SEED_PASSWORD = 'Password@123';

export class UserSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(TBUserDefault);
    const profileRepository = dataSource.getRepository(TBUserProfile);

    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    const usersData = JSON.parse(
      fs.readFileSync(usersPath, 'utf8'),
    ) as unknown as SeedUserData[];

    const hashedPassword = await bcrypt.hash(DEFAULT_SEED_PASSWORD, 10);
    let seededCount = 0;

    for (const data of usersData) {
      const existingUser = await userRepository.findOne({
        where: { email: data.email },
      });

      let profileId: number;

      if (existingUser?.userProfileId) {
        // Update existing profile
        let existingProfile = await profileRepository.findOne({
          where: { id: existingUser.userProfileId },
        });

        if (existingProfile) {
          existingProfile.fullName = data.profile.fullName;
          existingProfile.avatarUrl = data.profile.avatarUrl;
          existingProfile.phoneNumber = data.profile.phoneNumber;
          await profileRepository.save(existingProfile);
        } else {
          const newProfile = await profileRepository.save(
            profileRepository.create({
              fullName: data.profile.fullName,
              avatarUrl: data.profile.avatarUrl,
              phoneNumber: data.profile.phoneNumber,
            }),
          );
          existingProfile = newProfile;
        }
        profileId = existingProfile.id;
      } else {
        // Create new profile
        const newProfile = await profileRepository.save(
          profileRepository.create({
            fullName: data.profile.fullName,
            avatarUrl: data.profile.avatarUrl,
            phoneNumber: data.profile.phoneNumber,
          }),
        );
        profileId = newProfile.id;
      }

      // Upsert User
      const userPayload: Partial<TBUserDefault> = {
        email: data.email,
        password: hashedPassword,
        userRole: data.userRole,
        status: data.status,
        isEmailVerified: data.isEmailVerified,
        isApplyingForOwner: data.isApplyingForOwner ?? false,
        ownerRequestStatus: data.ownerRequestStatus,
        userProfileId: profileId,
      };

      if (existingUser) {
        await userRepository.save(
          userRepository.create({
            ...existingUser,
            ...userPayload,
          }),
        );
      } else {
        await userRepository.save(userRepository.create(userPayload));
      }

      seededCount++;
    }

    console.log(
      `✓ Seeded ${seededCount} users & profiles (Default password: "${DEFAULT_SEED_PASSWORD}").`,
    );
  }
}
