

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."difficulty_level" AS ENUM (
    'easy',
    'medium',
    'hard'
);


ALTER TYPE "public"."difficulty_level" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."coding_problems" (
    "id" integer NOT NULL,
    "problem_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "difficulty" "public"."difficulty_level" DEFAULT 'easy'::"public"."difficulty_level" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coding_problems" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."coding_problems_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."coding_problems_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."coding_problems_id_seq" OWNED BY "public"."coding_problems"."id";



CREATE TABLE IF NOT EXISTS "public"."lobbies" (
    "code" "text" NOT NULL,
    "host_id" "text" NOT NULL,
    "creator_name" "text",
    "opponent_id" "text",
    "opponent_name" "text",
    "status" "text" DEFAULT 'waiting'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lobbies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."lobbies"."code" IS 'Unique 6-character code for the lobby';



COMMENT ON COLUMN "public"."lobbies"."host_id" IS 'Firebase UID of the user who created the lobby';



COMMENT ON COLUMN "public"."lobbies"."creator_name" IS 'Display name/email of the host (optional)';



COMMENT ON COLUMN "public"."lobbies"."opponent_id" IS 'Firebase UID of the user who joined (null if empty)';



COMMENT ON COLUMN "public"."lobbies"."opponent_name" IS 'Display name/email of the opponent (null if empty)';



COMMENT ON COLUMN "public"."lobbies"."status" IS 'Lobby status: waiting, ready, starting, cancelled';



COMMENT ON COLUMN "public"."lobbies"."created_at" IS 'Timestamp when the lobby was created';



CREATE TABLE IF NOT EXISTS "public"."problem_examples" (
    "id" integer NOT NULL,
    "problem_id" "text",
    "input" "text" NOT NULL,
    "output" "text" NOT NULL,
    "explanation" "text",
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."problem_examples" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."problem_examples_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."problem_examples_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."problem_examples_id_seq" OWNED BY "public"."problem_examples"."id";



CREATE TABLE IF NOT EXISTS "public"."problem_starter_code" (
    "id" integer NOT NULL,
    "problem_id" "text",
    "language" "text" NOT NULL,
    "code" "text" NOT NULL,
    "method_name" "text"
);


ALTER TABLE "public"."problem_starter_code" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."problem_starter_code_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."problem_starter_code_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."problem_starter_code_id_seq" OWNED BY "public"."problem_starter_code"."id";



CREATE TABLE IF NOT EXISTS "public"."problem_test_cases" (
    "id" integer NOT NULL,
    "problem_id" "text",
    "input_json" "jsonb" NOT NULL,
    "expected_json" "jsonb" NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "test_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."problem_test_cases" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."problem_test_cases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."problem_test_cases_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."problem_test_cases_id_seq" OWNED BY "public"."problem_test_cases"."id";



ALTER TABLE ONLY "public"."coding_problems" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."coding_problems_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."problem_examples" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."problem_examples_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."problem_starter_code" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."problem_starter_code_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."problem_test_cases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."problem_test_cases_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."coding_problems"
    ADD CONSTRAINT "coding_problems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coding_problems"
    ADD CONSTRAINT "coding_problems_problem_id_key" UNIQUE ("problem_id");



ALTER TABLE ONLY "public"."lobbies"
    ADD CONSTRAINT "lobbies_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."problem_examples"
    ADD CONSTRAINT "problem_examples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."problem_starter_code"
    ADD CONSTRAINT "problem_starter_code_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."problem_starter_code"
    ADD CONSTRAINT "problem_starter_code_problem_id_language_key" UNIQUE ("problem_id", "language");



ALTER TABLE ONLY "public"."problem_test_cases"
    ADD CONSTRAINT "problem_test_cases_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "update_coding_problems_updated_at" BEFORE UPDATE ON "public"."coding_problems" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."problem_examples"
    ADD CONSTRAINT "problem_examples_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."coding_problems"("problem_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."problem_starter_code"
    ADD CONSTRAINT "problem_starter_code_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."coding_problems"("problem_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."problem_test_cases"
    ADD CONSTRAINT "problem_test_cases_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."coding_problems"("problem_id") ON DELETE CASCADE;



CREATE POLICY "Allow all operations for everyone" ON "public"."lobbies" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can read problem examples" ON "public"."problem_examples" FOR SELECT USING (true);



CREATE POLICY "Anyone can read problems" ON "public"."coding_problems" FOR SELECT USING (true);



CREATE POLICY "Anyone can read starter code" ON "public"."problem_starter_code" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can read visible test cases" ON "public"."problem_test_cases" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("is_hidden" = false) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Only admins can delete examples" ON "public"."problem_examples" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can delete problems" ON "public"."coding_problems" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can delete starter code" ON "public"."problem_starter_code" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can delete test cases" ON "public"."problem_test_cases" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can insert examples" ON "public"."problem_examples" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can insert problems" ON "public"."coding_problems" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can insert starter code" ON "public"."problem_starter_code" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can insert test cases" ON "public"."problem_test_cases" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can update examples" ON "public"."problem_examples" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can update problems" ON "public"."coding_problems" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can update starter code" ON "public"."problem_starter_code" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can update test cases" ON "public"."problem_test_cases" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."coding_problems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lobbies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."problem_examples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."problem_starter_code" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."problem_test_cases" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."coding_problems" TO "anon";
GRANT ALL ON TABLE "public"."coding_problems" TO "authenticated";
GRANT ALL ON TABLE "public"."coding_problems" TO "service_role";



GRANT ALL ON SEQUENCE "public"."coding_problems_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."coding_problems_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."coding_problems_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lobbies" TO "anon";
GRANT ALL ON TABLE "public"."lobbies" TO "authenticated";
GRANT ALL ON TABLE "public"."lobbies" TO "service_role";



GRANT ALL ON TABLE "public"."problem_examples" TO "anon";
GRANT ALL ON TABLE "public"."problem_examples" TO "authenticated";
GRANT ALL ON TABLE "public"."problem_examples" TO "service_role";



GRANT ALL ON SEQUENCE "public"."problem_examples_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."problem_examples_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."problem_examples_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."problem_starter_code" TO "anon";
GRANT ALL ON TABLE "public"."problem_starter_code" TO "authenticated";
GRANT ALL ON TABLE "public"."problem_starter_code" TO "service_role";



GRANT ALL ON SEQUENCE "public"."problem_starter_code_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."problem_starter_code_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."problem_starter_code_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."problem_test_cases" TO "anon";
GRANT ALL ON TABLE "public"."problem_test_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."problem_test_cases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."problem_test_cases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."problem_test_cases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."problem_test_cases_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
