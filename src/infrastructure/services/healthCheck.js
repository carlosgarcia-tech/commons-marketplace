import mongoose from 'mongoose';
import supabase from '../supabase/config/supabaseClient.js';

/**
 * Health check service for monitoring dependencies.
 */
export class HealthCheck {
    /**
     * Check MongoDB connection.
     * @returns {Promise<{status: string, latency?: number}>} Health status
     */
    static async checkMongoDB() {
        const start = Date.now();
        try {
            const state = mongoose.connection.readyState;
            const latency = Date.now() - start;

            if (state === 1) {
                return { status: 'healthy', latency };
            }
            return { status: 'unhealthy', reason: `State: ${state}` };
        } catch (error) {
            return { status: 'unhealthy', reason: error.message };
        }
    }

    /**
     * Check Supabase connection.
     * @returns {Promise<{status: string, latency?: number}>} Health status
     */
    static async checkSupabase() {
        if (!supabase) {
            return { status: 'disabled', reason: 'Supabase not configured' };
        }

        const start = Date.now();
        try {
            // Cheap PostgREST probe. The '_health' table is NOT required
            // to exist: any structured answer from PostgREST (including
            // 'table not found' errors, which carry a PGRST* code) proves
            // DNS + TLS + auth + API reachability, which is what a health
            // check cares about. Only network-level failures (no code at
            // all) mean the dependency is truly unreachable.
            const { error } = await supabase.from('_health').select('*').limit(1);
            const latency = Date.now() - start;

            if (error && !error.code) {
                return { status: 'unhealthy', reason: error.message };
            }
            return { status: 'healthy', latency };
        } catch (error) {
            return { status: 'unhealthy', reason: error.message };
        }
    }

    /**
     * Check all dependencies
     * @returns {Promise<object>} Full health status
     */
    static async checkAll() {
        const [mongodb, supabaseResult] = await Promise.all([
            this.checkMongoDB(),
            this.checkSupabase(),
        ]);

        const isHealthy = mongodb.status === 'healthy' && supabaseResult.status !== 'unhealthy';

        return {
            status: isHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks: {
                mongodb,
                supabase: supabaseResult,
            },
        };
    }
}

export default HealthCheck;
