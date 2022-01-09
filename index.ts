import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";


const bucket = new aws.s3.Bucket("alpacked", {
    website: {
        indexDocument: "index.html",
    },
    acl: "public-read-write",
    tags: {
        Name: "alpacked",
    },
});


const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
    bucket: bucket.id, // refer to the bucket created earlier
    policy: bucket.arn.apply(bucketArn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: [
                "s3:GetObject",
            ],
            Resource: [
                `${bucketArn}/*`, //
            ],
        }],
    })),
});

const s3OriginId = "myS3Origin";
const s3Distribution = new aws.cloudfront.Distribution("s3Distribution", {
    origins: [{
        domainName: bucket.bucketRegionalDomainName,
        originId: s3OriginId,
       
    }],
    enabled: true,
    isIpv6Enabled: true,
    comment: "Some comment",
    defaultRootObject: "index.html",
   
   
    defaultCacheBehavior: {
        allowedMethods: [
            "DELETE",
            "GET",
            "HEAD",
            "OPTIONS",
            "PATCH",
            "POST",
            "PUT",
        ],
        cachedMethods: [
            "GET",
            "HEAD",
        ],
        targetOriginId: s3OriginId,
        forwardedValues: {
            queryString: false,
            cookies: {
                forward: "none",
            },
        },
        viewerProtocolPolicy: "allow-all",
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
    },
    orderedCacheBehaviors: [
        {
            pathPattern: "/alpacked",
            allowedMethods: [
                "GET",
                "HEAD",
                "OPTIONS",
            ],
            cachedMethods: [
                "GET",
                "HEAD",
                "OPTIONS",
            ],
            targetOriginId: s3OriginId,
            forwardedValues: {
                queryString: false,
                headers: ["Origin"],
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 86400,
            maxTtl: 31536000,
            compress: true,
            viewerProtocolPolicy: "redirect-to-https",
        },
        {
            pathPattern: "/mypage",
            allowedMethods: [
                "GET",
                "HEAD",
                "OPTIONS",
            ],
            cachedMethods: [
                "GET",
                "HEAD",
            ],
            targetOriginId: s3OriginId,
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 3600,
            maxTtl: 86400,
            compress: true,
            viewerProtocolPolicy: "redirect-to-https",
        },
    ],
    priceClass: "PriceClass_200",
    restrictions: {
        geoRestriction: {
            restrictionType: "whitelist",
            locations: [
                "US",
                "CA",
                "GB",
                "DE",
                "UA"
            ],
        },
    },
    tags: {
        Environment: "production",
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
});