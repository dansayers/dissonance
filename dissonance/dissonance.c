#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>
#include <math.h>

// bsd: gcc dissonance.c -std=gnu99 -o dissonance -lm

#define MAX_PARTIALS 100
#define MAX_TONE_PARTIALS 12
#define OCTAVE_DIVISIONS 1200.0

#define MIN(A,B)	((A) < (B) ? (A) : (B))
#define MAX(A,B)	((A) > (B) ? (A) : (B))
#define ABS(A)	((A) < 0 ? (-(A)) : (A))

typedef struct PARTIAL {
    float frequency;
    float amplitude;
} PARTIAL;

PARTIAL partials[MAX_PARTIALS] = {0};
PARTIAL compareTone[MAX_TONE_PARTIALS] = {0};
int numPartials = 0, numTonePartials = 0;
float minRange = 0, maxRange = 0, rootFreq = 0;

void getCurve();
float getRoughness(PARTIAL a, PARTIAL b);

// ./dissonance -compare 1,1,2,0.5,3,0.25  -partials 220,1,440,0.5,880,0.25 -minrange 220 -maxrange 880

int main(int argc, const char * argv[]) {
    srand48(time(NULL));
    for (int i=0; i<argc; i++) {
        if (i == 0) continue;
        const char *arg = argv[i];
        if (strcmp(arg, "-partials") == 0) {
            i++;
            char * pch = (char *) malloc(50*sizeof(char*));;
            char *txt = strdup(argv[i]);
            
            int length = MIN(1000, strlen(txt));
            char subbuff[length];
            memcpy(subbuff, argv[i], length*sizeof(char));
            subbuff[length] = '\0';
            
            pch = strtok(subbuff, ",");
            free(txt);
            int j = 0;
            PARTIAL partial;
            while (pch != NULL) {
                if (j > MAX_PARTIALS * 2) {
                    printf("{\"error\": \"too much data\"}\n");
                    return 0;
                }
                if (j % 2 == 0) {
                    partial.frequency = atof(pch);
                } else {
                    partial.amplitude = atof(pch);
                    partials[numPartials] = partial;
                    numPartials++;
                }
                pch = strtok(NULL, ",");
                j++;
            }
            free(pch);
            continue;
        }
        if (strcmp(arg, "-compare") == 0) {
            i++;
            char * pch = (char *) malloc(50*sizeof(char*));;
            char *txt = strdup(argv[i]);
            
            int length = MIN(1000, strlen(txt));
            char subbuff[length];
            memcpy(subbuff, argv[i], length*sizeof(char));
            subbuff[length] = '\0';
            
            pch = strtok(subbuff, ",");
            free(txt);
            int j = 0;
            PARTIAL partial;
            while (pch != NULL) {
                if (j > MAX_TONE_PARTIALS * 2) {
                    printf("{\"error\": \"too much data\"}\n");
                    return 0;
                }
                if (j % 2 == 0) {
                    partial.frequency = atof(pch);
                } else {
                    partial.amplitude = atof(pch);
                    compareTone[numTonePartials] = partial;
                    numTonePartials++;
                }
                pch = strtok(NULL, ",");
                j++;
            }
            continue;
        }
        if (strcmp(arg, "-minrange") == 0) {
            i++;
            minRange = atof(argv[i]);
            continue;
        }
        if (strcmp(arg, "-maxrange") == 0) {
            i++;
            maxRange = atof(argv[i]);
            continue;
        }
        if (strcmp(arg, "-rootfreq") == 0) {
            i++;
            rootFreq = atof(argv[i]);
            continue;
        }
    }
    if (minRange == 0)
        printf("{\"error\": \"missing min range\"}\n");
    else if (maxRange == 0)
        printf("{\"error\": \"missing max range\"}\n");
    else if (numPartials == 0)
        printf("{\"error\": \"no partials\"}\n");
    else if (numTonePartials == 0)
        printf("{\"error\": \"no compare note\"}\n");
    else
        getCurve();
    return 0;
}

void getCurve() {
    float minCents = round(OCTAVE_DIVISIONS * logf(minRange)/logf(2));
    float maxCents = round(OCTAVE_DIVISIONS * logf(maxRange)/logf(2));
    float rootCents = round(OCTAVE_DIVISIONS * logf(rootFreq)/logf(2));
    int adjustCents = (int)(minCents - rootCents);
    PARTIAL compareAll[MAX_PARTIALS+MAX_TONE_PARTIALS] = {0};
    memcpy(compareAll, partials, numPartials*sizeof(PARTIAL));
//     printf("{\"data\":[[\"Cents\",\"Dissonance\"]");
    int range = (int)(maxCents-minCents);
    float dissonances[range];
    for (float i=minCents; i<=maxCents; i++) {
        float freq = powf(2, i/OCTAVE_DIVISIONS);
        for (int j=0; j<numTonePartials; j++) {
            compareAll[numPartials+j].frequency = freq * compareTone[j].frequency;
            compareAll[numPartials+j].amplitude = compareTone[j].amplitude;
        }
        float dissonance = 0;
        for (int j=0; j<numPartials+numTonePartials; j++) {
//            printf("%f, %f\n", compareAll[j].frequency, compareAll[j].amplitude);
            for (int k=0; k<numPartials+numTonePartials; k++) {
                dissonance += getRoughness(compareAll[j], compareAll[k]);
            }
        }
        dissonances[(int)(i-minCents)] = dissonance;
//         printf(",[%d,%.5f]", (int)(i-minCents), dissonance);
    }
    printf("{\"data\":[[\"Cents\",\"Dissonance\",\"Dissonance\"]");
    char minima[10];
    for (int i=0; i<=range; i++) {
        float data = dissonances[i];
        strcpy(minima, "null");
        if (i == 0) {
            if (dissonances[1] > data)
                sprintf(minima, "%f", data);
        } else if (dissonances[i-1] > data && (i == range || dissonances[i+1] > data))
            sprintf(minima, "%f", data);
        printf(",[%d,%.5f,%s]", i+adjustCents, data, minima);
    }
    printf("]}");
}

float getRoughness(PARTIAL a, PARTIAL b) {
    float A_min = MIN(a.amplitude, b.amplitude);
    float A_max = MAX(a.amplitude, b.amplitude);
    float F_min = MIN(a.frequency, b.frequency);
    float F_max = MAX(a.frequency, b.frequency);
    
    float X = A_min * A_max;
    if (X == 0) return 0;
    
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



