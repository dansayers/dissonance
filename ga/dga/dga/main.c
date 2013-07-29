#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>
#include <math.h>
#include <float.h>

#define NUM_GENERATIONS 30000
#define NUM_PER_REPORT 200
#define POPULATION 32
#define MUT_LIKELIHOOD 0.15
#define REC_LIKELIHOOD 0.2
#define MUT_RANGE 0.0002

#define RANDOM_INIT 1
#define NUM_TONES 5
#define INIT_SEMIS {2.02f,3.89f,6.01f,7.02f}
#define DRONE_TONE 4
#define ROOT_STRENGTH 1.0f
#define NUM_PARTIALS 6
#define PARTIAL_DROPOFF 0.88f
#define BASE_FREQ 261.6255653
#define MAX_RATIO_UP 1.017479692
#define MAX_RATIO_DOWN 0.9828205985

#define MIN(A,B)	((A) < (B) ? (A) : (B))
#define MAX(A,B)	((A) > (B) ? (A) : (B))
#define ABS(A)	((A) < 0 ? (-(A)) : (A))

typedef struct PARTIAL {
    float frequency;
    float amplitude;
} PARTIAL;

typedef struct NOTE {
    float baseFreq;
    PARTIAL partial[NUM_PARTIALS];
} NOTE;

typedef struct SCALE {
    NOTE note[NUM_TONES];
    PARTIAL partials[NUM_PARTIALS * NUM_TONES];
} SCALE;

typedef struct PAIR {
    NOTE note[2];
    PARTIAL partials[NUM_PARTIALS * 2];
} PAIR;


SCALE gene[POPULATION] = {0};
SCALE initGene;
SCALE bestGene;
PAIR compair;
float bestScore = FLT_MAX;
float initSemis[NUM_TONES-1] = INIT_SEMIS;

void microbial_tournament();
void print_population();
void population_setup();
void scale_setup(SCALE *scale);
float evaluate(int geneNum);

int main(int argc, const char * argv[]) {
    srand48(time(NULL));
    population_setup();
    int n = NUM_GENERATIONS;
    while (n--) {
        microbial_tournament();
        if (n % NUM_PER_REPORT == 0)
            print_population();
    }
    return 0;
}

void print_population() {
    for (int i=0; i<POPULATION; i++) {
        for (int j=0; j<NUM_TONES; j++) {
            printf("%.f ", 1200 * logf(gene[i].note[j].baseFreq/BASE_FREQ) / logf(2));
//            printf("%.2f ", gene[i].note[j].baseFreq);
        }
        printf("%.8f", evaluate(i));
        printf("\n");
    }
    printf("best:");
    for (int j=0; j<NUM_TONES; j++) {
        printf("%.f ", 1200 * logf(bestGene.note[j].baseFreq/BASE_FREQ) / logf(2));
//        printf("%.2f ", bestGene.note[j].baseFreq);
    }
    printf("%.8f", bestScore);
    printf("\n\n");
}

int compare(const void * a, const void * b) {
    NOTE *aa = (NOTE*)a;
    NOTE *bb = (NOTE*)b;
    
    if (aa->baseFreq > bb->baseFreq)
        return 1;
    else if (aa->baseFreq < bb->baseFreq)
        return -1;
    return 0;
}

void population_setup() {
    initGene.note[0].baseFreq = BASE_FREQ;
    for (int i=0; i<POPULATION; i++) {
        int bad = 0;
        for (int j=1; j<NUM_TONES; j++) {
            float newFreq = 0;
            int count = 0;
            do {
                newFreq = BASE_FREQ*(1 + drand48());
                bad += (newFreq > 1.92074589*BASE_FREQ || newFreq < 1.029302237*BASE_FREQ);
                for (int k = -1; k < j; k++) {
                    float cmp;
                    if (k == -1)
                        cmp = newFreq / (2 * BASE_FREQ);
                    else
                        cmp = newFreq / initGene.note[k].baseFreq;
                    if (cmp > 0.9715319412f && cmp < 1.029302237f) {
                        bad = 1;
                        break;
                    }
                }
                count++;
            } while (bad && count < 10);
            if (bad) {
                i--;
                break;
            }
            initGene.note[j].baseFreq = newFreq;
        }
        if (bad)
            continue;
        scale_setup(&initGene);
        memcpy(&gene[i], &initGene, sizeof(SCALE));
    }
    
//    initGene.note[0].baseFreq = BASE_FREQ;
//    for (int i=0; i<NUM_TONES-1; i++)
//        initGene.note[i+1].baseFreq = BASE_FREQ*powf(2, initSemis[i]/12.0);
//    scale_setup(&initGene);
//    for (int i=0; i<POPULATION; i++)
//        memcpy(&gene[i], &initGene, sizeof(SCALE));
}

void scale_setup(SCALE *scale) {
    int allPartInd = 0;
    for (int i=0; i<NUM_TONES; i++) {
        float freq;
        freq = scale->note[i].baseFreq;
        float amp = 1.0f;
        if (i == 0) amp = ROOT_STRENGTH;
        for (int j=0; j<NUM_PARTIALS; j++) {
            scale->note[i].partial[j].frequency = freq;
            scale->note[i].partial[j].amplitude = amp;
            freq += scale->note[i].baseFreq;
            amp *= PARTIAL_DROPOFF;
            scale->partials[allPartInd] = scale->note[i].partial[j];
            allPartInd++;
        }
    }
    qsort(scale->note, NUM_TONES, sizeof(NOTE), compare);
}

void pair_setup(PAIR *pair) {
    int allPartInd = 0;
    for (int i=0; i<2; i++) {
        float freq = pair->note[i].baseFreq;
        float amp = 1.0f;
        for (int j=0; j<NUM_PARTIALS; j++) {
            pair->note[i].partial[j].frequency = freq;
            pair->note[i].partial[j].amplitude = amp;
            freq += pair->note[i].baseFreq;
            amp *= PARTIAL_DROPOFF;
            pair->partials[allPartInd] = pair->note[i].partial[j];
            allPartInd++;
        }
    }
}

float getRoughness(PARTIAL a, PARTIAL b) {
    float A_min = MIN(a.amplitude, b.amplitude);
    float A_max = MAX(a.amplitude, b.amplitude);
    float F_min = MIN(a.frequency, b.frequency);
    float F_max = MAX(a.frequency, b.frequency);
    
    float X = A_min * A_max;
    
    float Y = 2 * A_min / (A_min + A_max);
    
    const static float b1 = 3.5;
    const static float b2 = 5.75;
    const static float s1 = 0.0207;
    const static float s2 = 18.96;
    float s  = 0.24 / (s1 * F_min + s2);
    
    float Z = expf(-b1 * s * (F_max - F_min)) - expf(-b2 * s * (F_max - F_min));
    
    float R = powf(X, 0.1) * 0.5 * powf(Y, 3.11) * Z;
    
    return R;
}

float getNormRand() {
    float u = drand48();
    float v = drand48();
    return sqrtf(-2 * logf(u)) * cosf(2 * M_PI * v);
}

float getDroneDissonance(int geneNum) {
    float dissonance = 0.0f;
    int comparisons = 0;
    SCALE *scale = &gene[geneNum];
    compair.note[0] = scale->note[0];
    for (int i=0; i<2; i++) {
        if (i == 1)
            compair.note[0] = initGene.note[DRONE_TONE];
        for (int j=1; j<NUM_TONES; j++) {
            compair.note[1] = scale->note[j];
            pair_setup(&compair);
            for (int x=0; x<NUM_PARTIALS * 2; x++) {
                for (int y=0; y<NUM_PARTIALS * 2; y++) {
                    dissonance += getRoughness(compair.partials[x], compair.partials[y]);
                    comparisons++;
                }
            }
        }
    }
    return dissonance/comparisons;
}

float getMutualDissonanceSD(int geneNum) {
    static float dissonances[NUM_TONES*NUM_TONES] = {0};
    int dissonancesCount = 0;
    float total = 0;
    SCALE *scale = &gene[geneNum];
    for (int i=0; i<NUM_TONES; i++) {
        compair.note[0] = scale->note[i];
        for (int j=0; j<NUM_TONES; j++) {
            if (i == j) continue;
            float dissonance = 0.0f;
            compair.note[1] = scale->note[j];
            pair_setup(&compair);
            for (int x=0; x<NUM_PARTIALS * 2; x++)
                for (int y=0; y<NUM_PARTIALS * 2; y++)
                    dissonance += getRoughness(compair.partials[x], compair.partials[y]);
            dissonances[dissonancesCount] = dissonance;
            total += dissonance;
            dissonancesCount++;
        }
    }
    float mean = total / dissonancesCount;
    float sd = 0;
    for (int i=0; i<dissonancesCount; i++) {
        float dev = dissonances[i]-mean;
        sd += dev*dev;
    }
    sd /= dissonancesCount;
    return sqrtf(sd)/100.0;
}

float getWorstDissonance(int geneNum) {
    SCALE *scale = &gene[geneNum];
    float worstDissonance = 0;
    for (int i=0; i<NUM_TONES; i++) {
        compair.note[0] = scale->note[i];
        for (int j=0; j<NUM_TONES; j++) {
            if (i == j) continue;
            float dissonance = 0.0f;
            compair.note[1] = scale->note[j];
            pair_setup(&compair);
            for (int x=0; x<NUM_PARTIALS * 2; x++)
                for (int y=0; y<NUM_PARTIALS * 2; y++)
                    dissonance += getRoughness(compair.partials[x], compair.partials[y]);
            if (dissonance > worstDissonance)
                worstDissonance = dissonance;
        }
    }
    return worstDissonance * 0.003;
}

float getTotalDissonance(int geneNum) {
    float dissonance = 0.0f;
    int comparisons = 0;
    SCALE *scale = &gene[geneNum];
    for (int i=0; i<NUM_PARTIALS * NUM_TONES; i++) {
        for (int j=0; j<NUM_PARTIALS * NUM_TONES; j++) {
            dissonance += getRoughness(scale->partials[i], scale->partials[j]);
            comparisons++;
        }
    }
    return dissonance/comparisons;
}

float evaluate(int geneNum) {
//    return getDroneDissonance(geneNum) + getMutualDissonanceSD(geneNum) + getWorstDissonance(geneNum) + getTotalDissonance(geneNum);
    return getTotalDissonance(geneNum);
}

void microbial_tournament() {
    int a, b, W, L, i;
    float da, db, dw;
    
    a = POPULATION * drand48();
    do {
        b = POPULATION * drand48();
    } while (a == b);

    da = evaluate(a);
    db = evaluate(b);
    if (da < db) {
        W = a;
        L = b;
        dw = da;
    } else {
        W = b;
        L = a;
        dw = db;
    }
    if (dw < bestScore) {
        bestScore = dw;
        memcpy(&bestGene, &gene[W], sizeof(SCALE));
    }
    
    for (i=1; i<NUM_TONES; i++) {
        if (drand48() < REC_LIKELIHOOD) {
            gene[L].note[i].baseFreq = gene[W].note[i].baseFreq;
        }
    }
    
    for (i=1; i<NUM_TONES; i++) {
        if (drand48() < MUT_LIKELIHOOD) {
            float newFreq;
            int bad = 0;
            int count = 0;
            do {
                bad = 0;
                newFreq = gene[W].note[i].baseFreq * (1 + MUT_RANGE * getNormRand());
                bad += (newFreq > 1.92074589*BASE_FREQ || newFreq < 1.029302237*BASE_FREQ);
                for (int k = -1; k < NUM_TONES; k++) {
                    if (k == i) continue;
                    float cmp;
                    if (k == -1)
                        cmp = newFreq / (2 * BASE_FREQ);
                    else
                        cmp = newFreq / gene[L].note[k].baseFreq;
                    if (cmp > 0.9715319412f && cmp < 1.029302237f) {
                        bad = 1;
                        break;
                    }
                }
                count++;
            } while (bad && count < 10);
            if (!bad) {
                gene[L].note[i].baseFreq = newFreq;
            }
        }
    }
    scale_setup(&gene[L]);
    for (int i=1; i<NUM_TONES; i++) {
        float cmp = gene[L].note[i].baseFreq / gene[L].note[i-1].baseFreq;
        if (cmp > 0.9715319412f && cmp < 1.029302237f) {
            memcpy(&gene[L], &gene[W], sizeof(SCALE));
        }
    }
}



