import { supabase } from './supabase'
import type { 
  User, Client, Project, Package, AddOn, TeamMember, Transaction, 
  FinancialPocket, Card, Lead, TeamProjectPayment, TeamPaymentRecord,
  RewardLedgerEntry, Asset, Contract, ClientFeedback, Notification,
  SocialMediaPost, PromoCode, SOP, Profile
} from '../types'
import { ViewType } from '../types'
import type { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js'

// Authentication and CRUD operations
class SupabaseService {
  // Authentication methods
  static async signUp(email: string, password: string, userData: { fullName: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          role: 'Member',
          is_approved: false
        }
      }
    })
    
    if (error) throw error
    
    // Create user record in our users table
    if (data.user) {
      try {
        const newUser = await this.createUser({
          id: data.user.id, // Use the auth user ID
          fullName: userData.fullName,
          email: email,
          password: '', // Don't store password in our table
          role: 'Member',
          permissions: [ViewType.DASHBOARD, ViewType.CLIENTS, ViewType.PROJECTS, ViewType.CALENDAR],
          isApproved: false // Wait for admin approval
        })
        
        return { ...data, customUser: newUser }
      } catch (error) {
        console.error('Error creating user record:', error);
        throw error;
      }
    }
    
    return data
  }

  static async signIn(email: string, password: string) {
    // Add timeout to prevent hanging - increased to 30 seconds for better reliability
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Koneksi terlalu lambat. Silakan periksa internet Anda dan coba lagi.')), 30000)
    );

    try {
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (error) throw error
      
      // Get user data from our users table - no fallback to admin
      if (data.user) {
        try {
          // Try to get user data from database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (userError) {
            throw new Error('User record not found in database. Please contact admin.');
          }
          
          // Check if user is approved
          if (!userData.is_approved) {
            throw new Error('Akun Anda sedang menunggu persetujuan admin. Silakan hubungi admin untuk aktivasi.');
          }
          
          const mappedUser = {
            id: userData.id,
            email: userData.email,
            password: '',
            fullName: userData.full_name,
            companyName: userData.company_name,
            role: userData.role,
            permissions: userData.permissions,
            isApproved: userData.is_approved
          };
          
          return { session: data.session, user: mappedUser }
        } catch (error: any) {
          // Sign out the user if they can't be found in our database
          await this.signOut();
          throw error;
        }
      }
      
      return data
    } catch (error: any) {
      if (error.message?.includes('timeout') || error.message?.includes('Koneksi terlalu lambat')) {
        throw new Error('Koneksi terlalu lambat. Silakan periksa internet Anda dan coba lagi.');
      }
      
      // Handle specific Supabase auth errors
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Email atau kata sandi salah.');
      }
      
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Email belum dikonfirmasi. Silakan cek email Anda.');
      }
      
      throw error;
    }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  static async getCurrentUser() {
    const session = await this.getCurrentSession()
    if (session?.user) {
      const users = await this.getUsers()
      return users.find(u => u.id === session.user.id) || null
    }
    return null
  }

  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
  // Users
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*')
    if (error) throw error
    return data || []
  }

  static async createUser(user: Omit<User, 'id'> | User): Promise<User> {
    const userRecord = {
      id: 'id' in user ? user.id : undefined, // Use provided ID if available
      email: user.email,
      password_hash: user.password, // In real app, this should be hashed
      full_name: user.fullName,
      company_name: user.companyName,
      role: user.role,
      permissions: user.permissions,
      is_approved: user.isApproved
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([userRecord])
      .select()
      .single()
    
    if (error) throw error
    return {
      id: data.id,
      email: data.email,
      password: '', // Don't return password
      fullName: data.full_name,
      companyName: data.company_name,
      role: data.role,
      permissions: data.permissions,
      isApproved: data.is_approved
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        email: updates.email,
        full_name: updates.fullName,
        company_name: updates.companyName,
        role: updates.role,
        permissions: updates.permissions,
        is_approved: updates.isApproved
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return {
      id: data.id,
      email: data.email,
      password: '',
      fullName: data.full_name,
      companyName: data.company_name,
      role: data.role,
      permissions: data.permissions,
      isApproved: data.is_approved
    }
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
  }

  // Profiles
  static async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) throw error
    return data?.map(this.mapProfileFromDB) || []
  }

  static async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error && error.code !== 'PGRST116') throw error
    return data ? this.mapProfileFromDB(data) : null
  }

  static async getPrimaryProfile(): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').limit(1).single()
    if (error && error.code !== 'PGRST116') throw error
    return data ? this.mapProfileFromDB(data) : null
  }

  static async createProfile(profile: Omit<Profile, 'id'>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([this.mapProfileToDB(profile)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapProfileFromDB(data)
  }

  static async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(this.mapProfileToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapProfileFromDB(data)
  }

  // Clients
  static async getClients(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*')
    if (error) throw error
    return data?.map(this.mapClientFromDB) || []
  }

  static async createClient(client: Omit<Client, 'id'>): Promise<Client> {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Gagal menyimpan data klien. Silakan coba lagi.')), 10000)
    );

    const createPromise = supabase
      .from('clients')
      .insert([this.mapClientToDB(client)])
      .select()
      .single();

    const { data, error } = await Promise.race([createPromise, timeoutPromise]) as any;
    
    if (error) throw error
    return this.mapClientFromDB(data)
  }

  static async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(this.mapClientToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapClientFromDB(data)
  }

  static async deleteClient(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  }

  static async getClientByPortalId(portalId: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('portal_access_id', portalId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 means no rows found, which is not an error here
    return data ? this.mapClientFromDB(data) : null
  }

  // Packages
  static async getPackages(): Promise<Package[]> {
    const { data, error } = await supabase.from('packages').select('*')
    if (error) throw error
    return data?.map(this.mapPackageFromDB) || []
  }

  static async createPackage(pkg: Omit<Package, 'id'>): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .insert([this.mapPackageToDB(pkg)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapPackageFromDB(data)
  }

  static async updatePackage(id: string, updates: Partial<Package>): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .update(this.mapPackageToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapPackageFromDB(data)
  }

  static async deletePackage(id: string): Promise<void> {
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) throw error
  }

  // Add-ons
  static async getAddOns(): Promise<AddOn[]> {
    const { data, error } = await supabase.from('add_ons').select('*')
    if (error) throw error
    return data?.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price
    })) || []
  }

  static async createAddOn(addOn: Omit<AddOn, 'id'>): Promise<AddOn> {
    const { data, error } = await supabase
      .from('add_ons')
      .insert([addOn])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateAddOn(id: string, updates: Partial<AddOn>): Promise<AddOn> {
    const { data, error } = await supabase
      .from('add_ons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteAddOn(id: string): Promise<void> {
    const { error } = await supabase.from('add_ons').delete().eq('id', id)
    if (error) throw error
  }

  // Projects
  static async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*')
    if (error) throw error
    return data?.map(this.mapProjectFromDB) || []
  }

  static async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Gagal menyimpan proyek. Silakan coba lagi.')), 10000)
    );

    const createPromise = supabase
      .from('projects')
      .insert([this.mapProjectToDB(project)])
      .select()
      .single();

    const { data, error } = await Promise.race([createPromise, timeoutPromise]) as any;
    
    if (error) throw error
    return this.mapProjectFromDB(data)
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(this.mapProjectToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapProjectFromDB(data)
  }

  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  }

  static async getProjectsByClientId(clientId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)

    if (error) throw error
    return data?.map(this.mapProjectFromDB) || []
  }

  // Similar methods for all other entities...
  // Team Members
  static async getTeamMembers(): Promise<TeamMember[]> {
    const { data, error } = await supabase.from('team_members').select('*')
    if (error) throw error
    return data?.map(this.mapTeamMemberFromDB) || []
  }

  static async createTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .insert([this.mapTeamMemberToDB(member)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapTeamMemberFromDB(data)
  }

  static async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update(this.mapTeamMemberToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapTeamMemberFromDB(data)
  }

  static async deleteTeamMember(id: string): Promise<void> {
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) throw error
  }

  // Continue with other entities (Transactions, Cards, etc.)
  static async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase.from('transactions').select('*')
    if (error) throw error
    return data?.map(this.mapTransactionFromDB) || []
  }

  static async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Gagal menyimpan transaksi. Silakan coba lagi.')), 10000)
    );

    const createPromise = supabase
      .from('transactions')
      .insert([this.mapTransactionToDB(transaction)])
      .select()
      .single();

    const { data, error } = await Promise.race([createPromise, timeoutPromise]) as any;
    
    if (error) throw error
    return this.mapTransactionFromDB(data)
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(this.mapTransactionToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapTransactionFromDB(data)
  }

  static async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
  }

  // Cards
  static async getCards(): Promise<Card[]> {
    const { data, error } = await supabase.from('cards').select('*')
    if (error) throw error
    return data?.map(this.mapCardFromDB) || []
  }

  static async createCard(card: Omit<Card, 'id'>): Promise<Card> {
    const { data, error } = await supabase
      .from('cards')
      .insert([this.mapCardToDB(card)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapCardFromDB(data)
  }

  static async updateCard(id: string, updates: Partial<Card>): Promise<Card> {
    const { data, error } = await supabase
      .from('cards')
      .update(this.mapCardToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapCardFromDB(data)
  }

  static async deleteCard(id: string): Promise<void> {
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) throw error
  }

  // Financial Pockets
  static async getFinancialPockets(): Promise<FinancialPocket[]> {
    const { data, error } = await supabase.from('financial_pockets').select('*')
    if (error) throw error
    return data?.map(this.mapFinancialPocketFromDB) || []
  }

  static async createFinancialPocket(pocket: Omit<FinancialPocket, 'id'>): Promise<FinancialPocket> {
    const { data, error } = await supabase
      .from('financial_pockets')
      .insert([this.mapFinancialPocketToDB(pocket)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapFinancialPocketFromDB(data)
  }

  static async updateFinancialPocket(id: string, updates: Partial<FinancialPocket>): Promise<FinancialPocket> {
    const { data, error } = await supabase
      .from('financial_pockets')
      .update(this.mapFinancialPocketToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapFinancialPocketFromDB(data)
  }

  static async deleteFinancialPocket(id: string): Promise<void> {
    const { error } = await supabase.from('financial_pockets').delete().eq('id', id)
    if (error) throw error
  }

  // Leads
  static async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*')
    if (error) throw error
    return data?.map(this.mapLeadFromDB) || []
  }

  static async createLead(lead: Omit<Lead, 'id'>): Promise<Lead> {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Gagal menyimpan prospek. Silakan coba lagi.')), 10000)
    );

    const createPromise = supabase
      .from('leads')
      .insert([this.mapLeadToDB(lead)])
      .select()
      .single();

    const { data, error } = await Promise.race([createPromise, timeoutPromise]) as any;
    
    if (error) throw error
    return this.mapLeadFromDB(data)
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(this.mapLeadToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapLeadFromDB(data)
  }

  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error
  }

  // Assets
  static async getAssets(): Promise<Asset[]> {
    const { data, error } = await supabase.from('assets').select('*')
    if (error) throw error
    return data?.map(this.mapAssetFromDB) || []
  }

  static async createAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert([this.mapAssetToDB(asset)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapAssetFromDB(data)
  }

  static async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .update(this.mapAssetToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapAssetFromDB(data)
  }

  static async deleteAsset(id: string): Promise<void> {
    const { error } = await supabase.from('assets').delete().eq('id', id)
    if (error) throw error
  }

  // Contracts
  static async getContracts(): Promise<Contract[]> {
    const { data, error } = await supabase.from('contracts').select('*')
    if (error) throw error
    return data?.map(this.mapContractFromDB) || []
  }

  static async createContract(contract: Omit<Contract, 'id'>): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert([this.mapContractToDB(contract)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapContractFromDB(data)
  }

  static async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update(this.mapContractToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapContractFromDB(data)
  }

  static async deleteContract(id: string): Promise<void> {
    const { error } = await supabase.from('contracts').delete().eq('id', id)
    if (error) throw error
  }

  static async getContractsByClientId(clientId:string): Promise<Contract[]> {
      const { data, error } = await supabase.from('contracts').select('*').eq('client_id', clientId);
      if (error) throw error;
      return data?.map(this.mapContractFromDB) || [];
  }

  // Client Feedback
  static async getClientFeedback(): Promise<ClientFeedback[]> {
    const { data, error } = await supabase.from('client_feedback').select('*')
    if (error) throw error
    return data?.map(this.mapClientFeedbackFromDB) || []
  }

  static async createClientFeedback(feedback: Omit<ClientFeedback, 'id'>): Promise<ClientFeedback> {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Gagal menyimpan feedback. Silakan coba lagi.')), 10000)
    );

    const createPromise = supabase
      .from('client_feedback')
      .insert([this.mapClientFeedbackToDB(feedback)])
      .select()
      .single();

    const { data, error } = await Promise.race([createPromise, timeoutPromise]) as any;
    
    if (error) throw error
    return this.mapClientFeedbackFromDB(data)
  }

  static async updateClientFeedback(id: string, updates: Partial<ClientFeedback>): Promise<ClientFeedback> {
    const { data, error } = await supabase
      .from('client_feedback')
      .update(this.mapClientFeedbackToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapClientFeedbackFromDB(data)
  }

  static async deleteClientFeedback(id: string): Promise<void> {
    const { error } = await supabase.from('client_feedback').delete().eq('id', id)
    if (error) throw error
  }

  // Notifications
  static async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase.from('notifications').select('*')
    if (error) throw error
    return data?.map(this.mapNotificationFromDB) || []
  }

  static async createNotification(notification: Omit<Notification, 'id'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([this.mapNotificationToDB(notification)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapNotificationFromDB(data)
  }

  static async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update(this.mapNotificationToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapNotificationFromDB(data)
  }

  static async deleteNotification(id: string): Promise<void> {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) throw error
  }

  // Social Media Posts
  static async getSocialMediaPosts(): Promise<SocialMediaPost[]> {
    const { data, error } = await supabase.from('social_media_posts').select('*')
    if (error) throw error
    return data?.map(this.mapSocialMediaPostFromDB) || []
  }

  static async createSocialMediaPost(post: Omit<SocialMediaPost, 'id'>): Promise<SocialMediaPost> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .insert([this.mapSocialMediaPostToDB(post)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapSocialMediaPostFromDB(data)
  }

  static async updateSocialMediaPost(id: string, updates: Partial<SocialMediaPost>): Promise<SocialMediaPost> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .update(this.mapSocialMediaPostToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapSocialMediaPostFromDB(data)
  }

  static async deleteSocialMediaPost(id: string): Promise<void> {
    const { error } = await supabase.from('social_media_posts').delete().eq('id', id)
    if (error) throw error
  }

  // Promo Codes
  static async getPromoCodes(): Promise<PromoCode[]> {
    const { data, error } = await supabase.from('promo_codes').select('*')
    if (error) throw error
    return data?.map(this.mapPromoCodeFromDB) || []
  }

  static async createPromoCode(promoCode: Omit<PromoCode, 'id'>): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert([this.mapPromoCodeToDB(promoCode)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapPromoCodeFromDB(data)
  }

  static async updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .update(this.mapPromoCodeToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapPromoCodeFromDB(data)
  }

  static async deletePromoCode(id: string): Promise<void> {
    const { error } = await supabase.from('promo_codes').delete().eq('id', id)
    if (error) throw error
  }

  // SOPs
  static async getSOPs(): Promise<SOP[]> {
    const { data, error } = await supabase.from('sops').select('*')
    if (error) throw error
    return data?.map(this.mapSOPFromDB) || []
  }

  static async createSOP(sop: Omit<SOP, 'id'>): Promise<SOP> {
    const { data, error } = await supabase
      .from('sops')
      .insert([this.mapSOPToDB(sop)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapSOPFromDB(data)
  }

  static async updateSOP(id: string, updates: Partial<SOP>): Promise<SOP> {
    const { data, error } = await supabase
      .from('sops')
      .update(this.mapSOPToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapSOPFromDB(data)
  }

  static async deleteSOP(id: string): Promise<void> {
    const { error } = await supabase.from('sops').delete().eq('id', id)
    if (error) throw error
  }

  // Team Project Payments
  static async getTeamProjectPayments(): Promise<TeamProjectPayment[]> {
    const { data, error } = await supabase.from('team_project_payments').select('*')
    if (error) throw error
    return data?.map(this.mapTeamProjectPaymentFromDB) || []
  }

  static async createTeamProjectPayment(payment: Omit<TeamProjectPayment, 'id'>): Promise<TeamProjectPayment> {
    const { data, error } = await supabase
      .from('team_project_payments')
      .insert([this.mapTeamProjectPaymentToDB(payment)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapTeamProjectPaymentFromDB(data)
  }

  static async updateTeamProjectPayment(id: string, updates: Partial<TeamProjectPayment>): Promise<TeamProjectPayment> {
    const { data, error } = await supabase
      .from('team_project_payments')
      .update(this.mapTeamProjectPaymentToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapTeamProjectPaymentFromDB(data)
  }

  static async deleteTeamProjectPayment(id: string): Promise<void> {
    const { error } = await supabase.from('team_project_payments').delete().eq('id', id)
    if (error) throw error
  }

  // Team Payment Records
  static async getTeamPaymentRecords(): Promise<TeamPaymentRecord[]> {
    const { data, error } = await supabase.from('team_payment_records').select('*')
    if (error) throw error
    return data?.map(this.mapTeamPaymentRecordFromDB) || []
  }

  static async createTeamPaymentRecord(record: Omit<TeamPaymentRecord, 'id'>): Promise<TeamPaymentRecord> {
    const { data, error } = await supabase
      .from('team_payment_records')
      .insert([this.mapTeamPaymentRecordToDB(record)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapTeamPaymentRecordFromDB(data)
  }

  static async updateTeamPaymentRecord(id: string, updates: Partial<TeamPaymentRecord>): Promise<TeamPaymentRecord> {
    const { data, error } = await supabase
      .from('team_payment_records')
      .update(this.mapTeamPaymentRecordToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapTeamPaymentRecordFromDB(data)
  }

  static async deleteTeamPaymentRecord(id: string): Promise<void> {
    const { error } = await supabase.from('team_payment_records').delete().eq('id', id)
    if (error) throw error
  }

  // Reward Ledger Entries
  static async getRewardLedgerEntries(): Promise<RewardLedgerEntry[]> {
    const { data, error } = await supabase.from('reward_ledger_entries').select('*')
    if (error) throw error
    return data?.map(this.mapRewardLedgerEntryFromDB) || []
  }

  static async createRewardLedgerEntry(entry: Omit<RewardLedgerEntry, 'id'>): Promise<RewardLedgerEntry> {
    const { data, error } = await supabase
      .from('reward_ledger_entries')
      .insert([this.mapRewardLedgerEntryToDB(entry)])
      .select()
      .single()
    
    if (error) throw error
    return this.mapRewardLedgerEntryFromDB(data)
  }

  static async updateRewardLedgerEntry(id: string, updates: Partial<RewardLedgerEntry>): Promise<RewardLedgerEntry> {
    const { data, error } = await supabase
      .from('reward_ledger_entries')
      .update(this.mapRewardLedgerEntryToDB(updates))
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return this.mapRewardLedgerEntryFromDB(data)
  }

  static async deleteRewardLedgerEntry(id: string): Promise<void> {
    const { error } = await supabase.from('reward_ledger_entries').delete().eq('id', id)
    if (error) throw error
  }

  // Helper mapping functions for database field name conversions
  private static mapProfileFromDB(data: any): Profile {
    return {
      id: data.id,
      adminUserId: data.admin_user_id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      companyName: data.company_name,
      website: data.website,
      address: data.address,
      bankAccount: data.bank_account,
      authorizedSigner: data.authorized_signer,
      idNumber: data.id_number,
      bio: data.bio,
      incomeCategories: data.income_categories || [],
      expenseCategories: data.expense_categories || [],
      projectTypes: data.project_types || [],
      eventTypes: data.event_types || [],
      assetCategories: data.asset_categories || [],
      sopCategories: data.sop_categories || [],
      packageCategories: data.package_categories || [],
      projectStatusConfig: data.project_status_config || [],
      notificationSettings: data.notification_settings || {},
      securitySettings: data.security_settings || {},
      briefingTemplate: data.briefing_template,
      termsAndConditions: data.terms_and_conditions,
      contractTemplate: data.contract_template,
      logoBase64: data.logo_base64,
      brandColor: data.brand_color,
      publicPageConfig: data.public_page_config || {},
      packageShareTemplate: data.package_share_template,
      bookingFormTemplate: data.booking_form_template,
      chatTemplates: data.chat_templates || []
    }
  }

  private static mapProfileToDB(profile: Partial<Profile>): any {
    return {
      admin_user_id: profile.adminUserId,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      company_name: profile.companyName,
      website: profile.website,
      address: profile.address,
      bank_account: profile.bankAccount,
      authorized_signer: profile.authorizedSigner,
      id_number: profile.idNumber,
      bio: profile.bio,
      income_categories: profile.incomeCategories,
      expense_categories: profile.expenseCategories,
      project_types: profile.projectTypes,
      event_types: profile.eventTypes,
      asset_categories: profile.assetCategories,
      sop_categories: profile.sopCategories,
      package_categories: profile.packageCategories,
      project_status_config: profile.projectStatusConfig,
      notification_settings: profile.notificationSettings,
      security_settings: profile.securitySettings,
      briefing_template: profile.briefingTemplate,
      terms_and_conditions: profile.termsAndConditions,
      contract_template: profile.contractTemplate,
      logo_base64: profile.logoBase64,
      brand_color: profile.brandColor,
      public_page_config: profile.publicPageConfig,
      package_share_template: profile.packageShareTemplate,
      booking_form_template: profile.bookingFormTemplate,
      chat_templates: profile.chatTemplates
    }
  }

  private static mapClientFromDB(data: any): Client {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      since: data.since,
      instagram: data.instagram,
      status: data.status,
      clientType: data.client_type,
      lastContact: data.last_contact,
      portalAccessId: data.portal_access_id
    }
  }

  private static mapClientToDB(client: Partial<Client>): any {
    return {
      name: client.name,
      email: client.email,
      phone: client.phone,
      whatsapp: client.whatsapp,
      since: client.since,
      instagram: client.instagram,
      status: client.status,
      client_type: client.clientType,
      last_contact: client.lastContact,
      portal_access_id: client.portalAccessId
    }
  }

  private static mapPackageFromDB(data: any): Package {
    return {
      id: data.id,
      name: data.name,
      price: data.price,
      category: data.category,
      physicalItems: data.physical_items || [],
      digitalItems: data.digital_items || [],
      processingTime: data.processing_time,
      defaultPrintingCost: data.default_printing_cost,
      defaultTransportCost: data.default_transport_cost,
      photographers: data.photographers,
      videographers: data.videographers,
      coverImage: data.cover_image
    }
  }

  private static mapPackageToDB(pkg: Partial<Package>): any {
    return {
      name: pkg.name,
      price: pkg.price,
      category: pkg.category,
      physical_items: pkg.physicalItems,
      digital_items: pkg.digitalItems,
      processing_time: pkg.processingTime,
      default_printing_cost: pkg.defaultPrintingCost,
      default_transport_cost: pkg.defaultTransportCost,
      photographers: pkg.photographers,
      videographers: pkg.videographers,
      cover_image: pkg.coverImage
    }
  }

  private static mapProjectFromDB(data: any): Project {
    return {
      id: data.id,
      projectName: data.project_name,
      clientName: data.client_name,
      clientId: data.client_id,
      projectType: data.project_type,
      packageName: data.package_name,
      packageId: data.package_id,
      addOns: data.add_ons || [],
      date: data.date,
      deadlineDate: data.deadline_date,
      location: data.location,
      progress: data.progress,
      status: data.status,
      activeSubStatuses: data.active_sub_statuses,
      totalCost: data.total_cost,
      amountPaid: data.amount_paid,
      paymentStatus: data.payment_status,
      team: data.team || [],
      notes: data.notes,
      accommodation: data.accommodation,
      driveLink: data.drive_link,
      clientDriveLink: data.client_drive_link,
      finalDriveLink: data.final_drive_link,
      startTime: data.start_time,
      endTime: data.end_time,
      image: data.image,
      revisions: data.revisions,
      promoCodeId: data.promo_code_id,
      discountAmount: data.discount_amount,
      shippingDetails: data.shipping_details,
      dpProofUrl: data.dp_proof_url,
      printingDetails: data.printing_details,
      printingCost: data.printing_cost,
      transportCost: data.transport_cost,
      isEditingConfirmedByClient: data.is_editing_confirmed_by_client,
      isPrintingConfirmedByClient: data.is_printing_confirmed_by_client,
      isDeliveryConfirmedByClient: data.is_delivery_confirmed_by_client,
      confirmedSubStatuses: data.confirmed_sub_statuses,
      clientSubStatusNotes: data.client_sub_status_notes,
      subStatusConfirmationSentAt: data.sub_status_confirmation_sent_at,
      completedDigitalItems: data.completed_digital_items,
      invoiceSignature: data.invoice_signature,
      customSubStatuses: data.custom_sub_statuses,
      bookingStatus: data.booking_status,
      rejectionReason: data.rejection_reason,
      chatHistory: data.chat_history
    }
  }

  private static mapProjectToDB(project: Partial<Project>): any {
    return {
      project_name: project.projectName,
      client_name: project.clientName,
      client_id: project.clientId,
      project_type: project.projectType,
      package_name: project.packageName,
      package_id: project.packageId,
      add_ons: project.addOns,
      date: project.date,
      deadline_date: project.deadlineDate,
      location: project.location,
      progress: project.progress,
      status: project.status,
      active_sub_statuses: project.activeSubStatuses,
      total_cost: project.totalCost,
      amount_paid: project.amountPaid,
      payment_status: project.paymentStatus,
      team: project.team,
      notes: project.notes,
      accommodation: project.accommodation,
      drive_link: project.driveLink,
      client_drive_link: project.clientDriveLink,
      final_drive_link: project.finalDriveLink,
      start_time: project.startTime,
      end_time: project.endTime,
      image: project.image,
      revisions: project.revisions,
      promo_code_id: project.promoCodeId,
      discount_amount: project.discountAmount,
      shipping_details: project.shippingDetails,
      dp_proof_url: project.dpProofUrl,
      printing_details: project.printingDetails,
      printing_cost: project.printingCost,
      transport_cost: project.transportCost,
      is_editing_confirmed_by_client: project.isEditingConfirmedByClient,
      is_printing_confirmed_by_client: project.isPrintingConfirmedByClient,
      is_delivery_confirmed_by_client: project.isDeliveryConfirmedByClient,
      confirmed_sub_statuses: project.confirmedSubStatuses,
      client_sub_status_notes: project.clientSubStatusNotes,
      sub_status_confirmation_sent_at: project.subStatusConfirmationSentAt,
      completed_digital_items: project.completedDigitalItems,
      invoice_signature: project.invoiceSignature,
      custom_sub_statuses: project.customSubStatuses,
      booking_status: project.bookingStatus,
      rejection_reason: project.rejectionReason,
      chat_history: project.chatHistory
    }
  }

  // Asset mapping functions
  private static mapAssetFromDB(data: any): Asset {
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      purchaseDate: data.purchase_date,
      purchasePrice: data.purchase_price,
      serialNumber: data.serial_number,
      status: data.status,
      notes: data.notes
    }
  }

  private static mapAssetToDB(asset: Partial<Asset>): any {
    return {
      name: asset.name,
      category: asset.category,
      purchase_date: asset.purchaseDate,
      purchase_price: asset.purchasePrice,
      serial_number: asset.serialNumber,
      status: asset.status,
      notes: asset.notes
    }
  }

  // Contract mapping functions
  private static mapContractFromDB(data: any): Contract {
    return {
      id: data.id,
      contractNumber: data.contract_number,
      clientId: data.client_id,
      projectId: data.project_id,
      signingDate: data.signing_date,
      signingLocation: data.signing_location,
      clientName1: data.client_name1,
      clientAddress1: data.client_address1,
      clientPhone1: data.client_phone1,
      clientName2: data.client_name2,
      clientAddress2: data.client_address2,
      clientPhone2: data.client_phone2,
      shootingDuration: data.shooting_duration,
      guaranteedPhotos: data.guaranteed_photos,
      albumDetails: data.album_details,
      digitalFilesFormat: data.digital_files_format,
      otherItems: data.other_items,
      personnelCount: data.personnel_count,
      deliveryTimeframe: data.delivery_timeframe,
      dpDate: data.dp_date,
      finalPaymentDate: data.final_payment_date,
      cancellationPolicy: data.cancellation_policy,
      jurisdiction: data.jurisdiction,
      vendorSignature: data.vendor_signature,
      clientSignature: data.client_signature,
      createdAt: data.created_at
    }
  }

  private static mapContractToDB(contract: Partial<Contract>): any {
    return {
      contract_number: contract.contractNumber,
      client_id: contract.clientId,
      project_id: contract.projectId,
      signing_date: contract.signingDate,
      signing_location: contract.signingLocation,
      client_name1: contract.clientName1,
      client_address1: contract.clientAddress1,
      client_phone1: contract.clientPhone1,
      client_name2: contract.clientName2,
      client_address2: contract.clientAddress2,
      client_phone2: contract.clientPhone2,
      shooting_duration: contract.shootingDuration,
      guaranteed_photos: contract.guaranteedPhotos,
      album_details: contract.albumDetails,
      digital_files_format: contract.digitalFilesFormat,
      other_items: contract.otherItems,
      personnel_count: contract.personnelCount,
      delivery_timeframe: contract.deliveryTimeframe,
      dp_date: contract.dpDate,
      final_payment_date: contract.finalPaymentDate,
      cancellation_policy: contract.cancellationPolicy,
      jurisdiction: contract.jurisdiction,
      vendor_signature: contract.vendorSignature,
      client_signature: contract.clientSignature
    }
  }

  // Client Feedback mapping functions
  private static mapClientFeedbackFromDB(data: any): ClientFeedback {
    return {
      id: data.id,
      clientName: data.client_name,
      satisfaction: data.satisfaction,
      rating: data.rating,
      feedback: data.feedback,
      date: data.date
    }
  }

  private static mapClientFeedbackToDB(feedback: Partial<ClientFeedback>): any {
    return {
      client_name: feedback.clientName,
      satisfaction: feedback.satisfaction,
      rating: feedback.rating,
      feedback: feedback.feedback,
      date: feedback.date
    }
  }

  // Notification mapping functions
  private static mapNotificationFromDB(data: any): Notification {
    return {
      id: data.id,
      title: data.title,
      message: data.message,
      timestamp: data.timestamp,
      isRead: data.is_read,
      icon: data.icon,
      link: data.link_view ? {
        view: data.link_view as ViewType,
        action: data.link_action
      } : undefined
    }
  }

  private static mapNotificationToDB(notification: Partial<Notification>): any {
    return {
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      is_read: notification.isRead,
      icon: notification.icon,
      link_view: notification.link?.view,
      link_action: notification.link?.action
    }
  }

  // Social Media Post mapping functions
  private static mapSocialMediaPostFromDB(data: any): SocialMediaPost {
    return {
      id: data.id,
      projectId: data.project_id,
      clientName: data.client_name,
      postType: data.post_type,
      platform: data.platform,
      scheduledDate: data.scheduled_date,
      caption: data.caption,
      mediaUrl: data.media_url,
      status: data.status,
      notes: data.notes
    }
  }

  private static mapSocialMediaPostToDB(post: Partial<SocialMediaPost>): any {
    return {
      project_id: post.projectId,
      client_name: post.clientName,
      post_type: post.postType,
      platform: post.platform,
      scheduled_date: post.scheduledDate,
      caption: post.caption,
      media_url: post.mediaUrl,
      status: post.status,
      notes: post.notes
    }
  }

  // Promo Code mapping functions
  private static mapPromoCodeFromDB(data: any): PromoCode {
    return {
      id: data.id,
      code: data.code,
      discountType: data.discount_type,
      discountValue: data.discount_value,
      isActive: data.is_active,
      usageCount: data.usage_count,
      maxUsage: data.max_usage,
      expiryDate: data.expiry_date,
      createdAt: data.created_at
    }
  }

  private static mapPromoCodeToDB(promoCode: Partial<PromoCode>): any {
    return {
      code: promoCode.code,
      discount_type: promoCode.discountType,
      discount_value: promoCode.discountValue,
      is_active: promoCode.isActive,
      usage_count: promoCode.usageCount,
      max_usage: promoCode.maxUsage,
      expiry_date: promoCode.expiryDate
    }
  }

  // SOP mapping functions
  private static mapSOPFromDB(data: any): SOP {
    return {
      id: data.id,
      title: data.title,
      category: data.category,
      content: data.content,
      lastUpdated: data.last_updated
    }
  }

  private static mapSOPToDB(sop: Partial<SOP>): any {
    return {
      title: sop.title,
      category: sop.category,
      content: sop.content,
      last_updated: sop.lastUpdated
    }
  }

  // Team Project Payment mapping functions
  private static mapTeamProjectPaymentFromDB(data: any): TeamProjectPayment {
    return {
      id: data.id,
      projectId: data.project_id,
      teamMemberName: data.team_member_name,
      teamMemberId: data.team_member_id,
      date: data.date,
      status: data.status,
      fee: data.fee,
      reward: data.reward
    }
  }

  private static mapTeamProjectPaymentToDB(payment: Partial<TeamProjectPayment>): any {
    return {
      project_id: payment.projectId,
      team_member_name: payment.teamMemberName,
      team_member_id: payment.teamMemberId,
      date: payment.date,
      status: payment.status,
      fee: payment.fee,
      reward: payment.reward
    }
  }

  // Team Payment Record mapping functions
  private static mapTeamPaymentRecordFromDB(data: any): TeamPaymentRecord {
    return {
      id: data.id,
      recordNumber: data.record_number,
      teamMemberId: data.team_member_id,
      date: data.date,
      projectPaymentIds: data.project_payment_ids,
      totalAmount: data.total_amount,
      vendorSignature: data.vendor_signature
    }
  }

  private static mapTeamPaymentRecordToDB(record: Partial<TeamPaymentRecord>): any {
    return {
      record_number: record.recordNumber,
      team_member_id: record.teamMemberId,
      date: record.date,
      project_payment_ids: record.projectPaymentIds,
      total_amount: record.totalAmount,
      vendor_signature: record.vendorSignature
    }
  }

  // Reward Ledger Entry mapping functions
  private static mapRewardLedgerEntryFromDB(data: any): RewardLedgerEntry {
    return {
      id: data.id,
      teamMemberId: data.team_member_id,
      date: data.date,
      description: data.description,
      amount: data.amount,
      projectId: data.project_id
    }
  }

  private static mapRewardLedgerEntryToDB(entry: Partial<RewardLedgerEntry>): any {
    return {
      team_member_id: entry.teamMemberId,
      date: entry.date,
      description: entry.description,
      amount: entry.amount,
      project_id: entry.projectId
    }
  }
  private static mapTeamMemberFromDB(data: any): TeamMember {
    return {
      id: data.id,
      name: data.name,
      role: data.role,
      email: data.email,
      phone: data.phone,
      standardFee: data.standard_fee,
      noRek: data.no_rek,
      rewardBalance: data.reward_balance,
      rating: data.rating,
      performanceNotes: data.performance_notes || [],
      portalAccessId: data.portal_access_id
    }
  }

  private static mapTeamMemberToDB(member: Partial<TeamMember>): any {
    return {
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      standard_fee: member.standardFee,
      no_rek: member.noRek,
      reward_balance: member.rewardBalance,
      rating: member.rating,
      performance_notes: member.performanceNotes,
      portal_access_id: member.portalAccessId
    }
  }

  private static mapTransactionFromDB(data: any): Transaction {
    return {
      id: data.id,
      date: data.date,
      description: data.description,
      amount: data.amount,
      type: data.type,
      projectId: data.project_id,
      category: data.category,
      method: data.method,
      pocketId: data.pocket_id,
      cardId: data.card_id,
      printingItemId: data.printing_item_id,
      vendorSignature: data.vendor_signature
    }
  }

  private static mapTransactionToDB(transaction: Partial<Transaction>): any {
    return {
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      project_id: transaction.projectId,
      category: transaction.category,
      method: transaction.method,
      pocket_id: transaction.pocketId,
      card_id: transaction.cardId,
      printing_item_id: transaction.printingItemId,
      vendor_signature: transaction.vendorSignature
    }
  }

  private static mapCardFromDB(data: any): Card {
    return {
      id: data.id,
      cardHolderName: data.card_holder_name,
      bankName: data.bank_name,
      cardType: data.card_type,
      lastFourDigits: data.last_four_digits,
      expiryDate: data.expiry_date,
      balance: data.balance,
      colorGradient: data.color_gradient
    }
  }

  private static mapCardToDB(card: Partial<Card>): any {
    return {
      card_holder_name: card.cardHolderName,
      bank_name: card.bankName,
      card_type: card.cardType,
      last_four_digits: card.lastFourDigits,
      expiry_date: card.expiryDate,
      balance: card.balance,
      color_gradient: card.colorGradient
    }
  }

  private static mapFinancialPocketFromDB(data: any): FinancialPocket {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      type: data.type,
      amount: data.amount,
      goalAmount: data.goal_amount,
      lockEndDate: data.lock_end_date,
      members: data.members,
      sourceCardId: data.source_card_id
    }
  }

  private static mapFinancialPocketToDB(pocket: Partial<FinancialPocket>): any {
    return {
      name: pocket.name,
      description: pocket.description,
      icon: pocket.icon,
      type: pocket.type,
      amount: pocket.amount,
      goal_amount: pocket.goalAmount,
      lock_end_date: pocket.lockEndDate,
      members: pocket.members,
      source_card_id: pocket.sourceCardId
    }
  }

  private static mapLeadFromDB(data: any): Lead {
    return {
      id: data.id,
      name: data.name,
      contactChannel: data.contact_channel,
      location: data.location,
      status: data.status,
      date: data.date,
      notes: data.notes,
      whatsapp: data.whatsapp
    }
  }

  private static mapLeadToDB(lead: Partial<Lead>): any {
    return {
      name: lead.name,
      contact_channel: lead.contactChannel,
      location: lead.location,
      status: lead.status,
      date: lead.date,
      notes: lead.notes,
      whatsapp: lead.whatsapp
    }
  }
}

export default SupabaseService